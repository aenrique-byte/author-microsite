# Database Schema Issues

## Problem Description
**Symptom**: Homepage fails to load, shows "Loading..." indefinitely, or displays database-related errors.

**What You See**:
- Homepage stuck on loading screen
- Console errors about missing database columns
- API endpoints returning database errors
- Profile information not displaying correctly

## Root Cause
**Missing Database Columns**: The application expects database columns that don't exist in the current schema.

In our case:
- Homepage expected `background_image_light` and `background_image_dark` columns
- Database only had a single `background_image` column
- API calls failed, causing the homepage to never finish loading

## Solution Steps

### 1. Identify Missing Columns
Check the API response and application code to see what columns are expected:
```sql
-- Check current table structure
DESCRIBE authors;

-- Look for missing columns in the application code
-- Example: AuthorHomepage.tsx expects background_image_light and background_image_dark
```

### 2. Create Migration Script
Create a SQL migration file to add missing columns:
```sql
-- api/schema-update-background-images.sql
ALTER TABLE authors 
ADD COLUMN background_image_light VARCHAR(255) DEFAULT NULL,
ADD COLUMN background_image_dark VARCHAR(255) DEFAULT NULL;

-- Migrate existing data if needed
UPDATE authors 
SET background_image_dark = background_image 
WHERE background_image IS NOT NULL;
```

### 3. Create Migration Runner
Create a PHP script to run the migration safely:
```php
// api/run-background-images-migration.php
<?php
require_once 'bootstrap.php';

try {
    // Check if columns already exist
    $checkQuery = "SHOW COLUMNS FROM authors LIKE 'background_image_light'";
    $result = $pdo->query($checkQuery);
    
    if ($result->rowCount() == 0) {
        // Run migration
        $sql = file_get_contents('schema-update-background-images.sql');
        $pdo->exec($sql);
        echo "Migration completed successfully.\n";
    } else {
        echo "Migration already applied.\n";
    }
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
?>
```

### 4. Update API Endpoints
Ensure API endpoints handle the new columns:
```php
// api/author/get.php - Add new columns to SELECT
$stmt = $pdo->prepare("
    SELECT name, bio, tagline, profile_image, 
           background_image_light, background_image_dark 
    FROM authors WHERE id = 1
");

// api/author/update.php - Handle new columns in UPDATE
if (isset($data['background_image_light'])) {
    $stmt = $pdo->prepare("
        UPDATE authors 
        SET background_image_light = ? 
        WHERE id = 1
    ");
    $stmt->execute([$data['background_image_light']]);
}
```

### 5. Run Migration
Execute the migration script:
```bash
php api/run-background-images-migration.php
```

## Prevention

### Best Practices
1. **Version Control Schema**: Keep all database schema changes in version-controlled migration files
2. **Safe Migrations**: Always check if changes already exist before applying them
3. **Backward Compatibility**: Design schema changes to be backward compatible when possible
4. **Test Migrations**: Test migration scripts on a copy of production data first
5. **Document Changes**: Keep a changelog of all schema modifications

### Migration File Naming Convention
```
api/schema-update-[feature-name].sql
api/run-[feature-name]-migration.php
```

### Code Review Checklist
- [ ] Are all expected database columns documented?
- [ ] Does the migration script check for existing columns?
- [ ] Are API endpoints updated to handle new columns?
- [ ] Is there a rollback plan if the migration fails?
- [ ] Has the migration been tested on sample data?

## Common Database Issues

### Missing Columns
**Problem**: Application expects columns that don't exist
**Solution**: Create migration script to add columns

### Data Type Mismatches
**Problem**: Application expects different data types than what's in the database
**Solution**: Use ALTER TABLE to modify column types

### Missing Tables
**Problem**: Application references tables that don't exist
**Solution**: Create table creation scripts and run them

### Constraint Violations
**Problem**: Data doesn't meet database constraints
**Solution**: Update constraints or clean data before migration

## Related Issues
- [API Response Parsing](./api-parsing-errors.md) - Database errors often cause API parsing issues
- [Build & Deployment Structure](./build-deployment-issues.md) - Database setup is part of deployment
