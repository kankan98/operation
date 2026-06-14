## ADDED Requirements

### Requirement: Create product
The system SHALL allow creating a new product with all required fields.

#### Scenario: Create product with valid data
- **WHEN** POST request to /api/products with valid product data
- **THEN** system SHALL create the product and return 201 status with product data including generated id

#### Scenario: Reject duplicate product URL
- **WHEN** POST request with a productUrl that already exists
- **THEN** system SHALL return 409 status with error code DUPLICATE_URL

#### Scenario: Reject missing required fields
- **WHEN** POST request with missing required fields (platform, productUrl, asin, title, currency, isMonitoring, checkInterval)
- **THEN** system SHALL return 400 status with validation error

### Requirement: List products
The system SHALL allow retrieving a list of products with filtering and pagination.

#### Scenario: List all products
- **WHEN** GET request to /api/products
- **THEN** system SHALL return 200 status with array of products and pagination metadata

#### Scenario: Filter by monitoring status
- **WHEN** GET request to /api/products?monitoring=true
- **THEN** system SHALL return only products where isMonitoring is true

#### Scenario: Filter by platform
- **WHEN** GET request to /api/products?platform=amazon
- **THEN** system SHALL return only products from the specified platform

#### Scenario: Paginate results
- **WHEN** GET request to /api/products?page=2&limit=10
- **THEN** system SHALL return products 11-20 with pagination showing page 2, limit 10

### Requirement: Get product by ID
The system SHALL allow retrieving a specific product by its ID.

#### Scenario: Get existing product
- **WHEN** GET request to /api/products/:id with valid product id
- **THEN** system SHALL return 200 status with product data

#### Scenario: Product not found
- **WHEN** GET request to /api/products/:id with non-existent id
- **THEN** system SHALL return 404 status with error code PRODUCT_NOT_FOUND

### Requirement: Update product
The system SHALL allow updating product fields.

#### Scenario: Update product fields
- **WHEN** PATCH request to /api/products/:id with update data
- **THEN** system SHALL update the specified fields and return 200 status with updated product

#### Scenario: Update non-existent product
- **WHEN** PATCH request to /api/products/:id with non-existent id
- **THEN** system SHALL return 404 status with error code PRODUCT_NOT_FOUND

### Requirement: Delete product
The system SHALL allow deleting a product.

#### Scenario: Delete existing product
- **WHEN** DELETE request to /api/products/:id with valid product id
- **THEN** system SHALL delete the product and return 204 status

#### Scenario: Delete non-existent product
- **WHEN** DELETE request to /api/products/:id with non-existent id
- **THEN** system SHALL return 404 status with error code PRODUCT_NOT_FOUND
