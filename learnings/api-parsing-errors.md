# API Response Parsing Errors

## Problem Description
**Symptom**: Getting `Unexpected token '<', "<!doctype "...` or similar JSON parsing errors when making API calls.

**What You See**:
- Frontend shows JSON parsing errors in console
- API operations fail silently or with cryptic error messages
- Network tab shows HTML error pages instead of expected JSON responses
- Error messages like "SyntaxError: Unexpected token '<' in JSON at position 0"

## Root Cause
**Server Returning HTML Instead of JSON**: The server is returning HTML error pages instead of JSON responses, usually due to:
1. HTTP method mismatches
2. Authentication failures
3. PHP errors or exceptions
4. Server configuration issues

## Solution Steps

### 1. Check Network Tab
Inspect the actual response in browser dev tools:
```javascript
// In Network tab, look at the response body
// If you see HTML like <!DOCTYPE html> instead of JSON, that's the problem
```

### 2. Verify HTTP Method
Ensure frontend and backend use the same HTTP method:
```typescript
// Frontend
const response = await fetch('/api/endpoint.php', {
    method: 'POST', // Make sure this matches backend expectation
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
});

// Backend (PHP)
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}
```

### 3. Check Authentication
Verify authentication is working:
```php
// Backend - Always check auth first
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}
```

### 4. Add Error Handling
Ensure all PHP errors return JSON:
```php
// At the top of PHP files
ini_set('display_errors', 0);
error_reporting(E_ALL);
header('Content-Type: application/json');

try {
    // Your API logic here
    echo json_encode(['success' => true, 'data' => $result]);
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
```

### 5. Improve Frontend Error Handling
Add better error handling in frontend:
```typescript
try {
    const response = await fetch('/api/endpoint.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(data)
    });

    // Check if response is actually JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response');
    }

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Request failed');
    }

    const data = await response.json();
    return data;
} catch (error) {
    console.error('API Error:', error);
    throw error;
}
```

## Prevention

### Best Practices

#### 1. Consistent Error Handling
**All API endpoints should return JSON, never HTML:**
```php
// Good: Always return JSON
header('Content-Type: application/json');
echo json_encode(['error' => 'Something went wrong']);

// Bad: Let PHP return HTML error page
throw new Exception('Something went wrong');
```

#### 2. Early Content-Type Headers
**Set JSON content type early:**
```php
<?php
// Set this immediately after opening tag
header('Content-Type: application/json');
ini_set('display_errors', 0);
error_reporting(E_ALL);
```

#### 3. Comprehensive Error Handling
**Wrap all API logic in try-catch:**
```php
try {
    // All your API logic here
    echo json_encode(['success' => true, 'data' => $result]);
} catch (Exception $e) {
    error_log("API Error in " . __FILE__ . ": " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
} catch (Throwable $e) {
    error_log("Fatal error in " . __FILE__ . ": " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Fatal error occurred']);
}
```

#### 4. Frontend Response Validation
**Always validate response content type:**
```typescript
async function apiCall(url: string, options: RequestInit = {}) {
    try {
        const response = await fetch(url, {
            credentials: 'same-origin',
            ...options
        });

        // Validate content type
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response from', url, ':', text);
            throw new Error('Server returned non-JSON response');
        }

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API call failed:', url, error);
        throw error;
    }
}
```

### API Endpoint Template
```php
<?php
// Standard API endpoint template
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once '../bootstrap.php';

header('Content-Type: application/json');

// Check authentication
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Check HTTP method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Get and validate input
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }

    // Your API logic here
    $result = performOperation($input);

    // Return success response
    echo json_encode([
        'success' => true,
        'data' => $result
    ]);

} catch (Exception $e) {
    error_log("API Error in " . basename(__FILE__) . ": " . $e->getMessage());
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
} catch (Throwable $e) {
    error_log("Fatal error in " . basename(__FILE__) . ": " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
?>
```

### Code Review Checklist
- [ ] Does the endpoint set `Content-Type: application/json` header?
- [ ] Is all logic wrapped in try-catch blocks?
- [ ] Are PHP errors suppressed (`display_errors = 0`)?
- [ ] Does the frontend validate response content type?
- [ ] Are HTTP methods consistent between frontend and backend?
- [ ] Is authentication checked before processing?

## Common Parsing Issues

### HTML Error Pages
**Problem**: Server returns HTML error page instead of JSON
**Solution**: Set JSON content type and handle all errors properly

### PHP Errors
**Problem**: PHP errors cause HTML output
**Solution**: Suppress display_errors and use try-catch blocks

### Authentication Redirects
**Problem**: Unauthenticated requests redirect to login page (HTML)
**Solution**: Check authentication and return JSON error instead

### Method Not Allowed
**Problem**: Wrong HTTP method returns HTML error page
**Solution**: Check method and return JSON error response

### Database Errors
**Problem**: Database connection errors cause PHP to output HTML
**Solution**: Wrap database operations in try-catch blocks

## Debugging Steps

### 1. Check Response Content Type
```javascript
// In browser console
fetch('/api/endpoint.php')
  .then(response => {
    console.log('Content-Type:', response.headers.get('content-type'));
    return response.text();
  })
  .then(text => console.log('Response body:', text));
```

### 2. Test with curl
```bash
# Test API endpoint directly
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}' \
  https://yoursite.com/api/endpoint.php
```

### 3. Check PHP Error Logs
```bash
# Check server error logs
tail -f /var/log/apache2/error.log
# or
tail -f /var/log/nginx/error.log
```

### 4. Add Debug Logging
```php
// Temporary debug logging
error_log("API endpoint reached: " . $_SERVER['REQUEST_METHOD']);
error_log("Input data: " . file_get_contents('php://input'));
```

## Related Issues
- [HTTP Method Mismatches](./http-method-issues.md) - Method mismatches often cause parsing errors
- [Database Schema Issues](./database-errors.md) - Database errors can cause HTML responses
