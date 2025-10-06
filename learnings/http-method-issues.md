# HTTP Method Mismatches

## Problem Description
**Symptom**: Getting `Unexpected token '<', "<!doctype "...` JSON parsing errors when trying to delete files or perform API operations.

**What You See**:
- Frontend shows JSON parsing errors
- Network tab shows HTML error pages instead of JSON responses
- Delete operations fail silently or with cryptic errors

## Root Cause
**HTTP Method Inconsistency**: Frontend sending DELETE requests while backend expects POST requests.

In our case:
- `UploadManager.tsx` was sending `method: 'DELETE'`
- `api/images/manage.php` was checking for `$_SERVER['REQUEST_METHOD'] === 'DELETE'`
- But other working endpoints like `api/galleries/delete.php` use `$_SERVER['REQUEST_METHOD'] === 'POST'`

When methods don't match, the server returns an HTML error page instead of JSON, causing parsing errors.

## Solution Steps

### 1. Identify the Pattern
Check working endpoints to see what method they use:
```php
// Working pattern in api/galleries/delete.php
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}
```

### 2. Update Frontend
Change the request method and add action parameter:
```typescript
// Before (broken)
const response = await fetch('/api/images/manage.php', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ path: file.path })
});

// After (working)
const response = await fetch('/api/images/manage.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ action: 'delete', path: file.path })
});
```

### 3. Update Backend
Change to expect POST and handle action parameter:
```php
// Before (broken)
} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['path'])) {
        throw new Exception('File path is required');
    }

// After (working)
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['action'])) {
        throw new Exception('Action is required');
    }
    if ($input['action'] === 'delete') {
        if (!isset($input['path'])) {
            throw new Exception('File path is required');
        }
        // ... rest of delete logic
    } else {
        throw new Exception('Unknown action: ' . $input['action']);
    }
```

## Prevention

### Best Practices
1. **Standardize HTTP Methods**: Use POST for all data-modifying operations across the entire project
2. **Use Action Parameters**: Include `action` field in POST body to specify the operation
3. **Consistent Error Handling**: Always return JSON responses, never HTML error pages
4. **Follow Existing Patterns**: Check how other endpoints handle similar operations before implementing new ones

### Code Review Checklist
- [ ] Does the frontend method match the backend expectation?
- [ ] Are we following the same pattern as other working endpoints?
- [ ] Does the backend always return JSON (never HTML)?
- [ ] Is there proper error handling for method mismatches?

## Related Issues
- [API Response Parsing](./api-parsing-errors.md) - JSON parsing errors often stem from method mismatches
- [Component Centralization](./component-issues.md) - Shared components help maintain consistency
