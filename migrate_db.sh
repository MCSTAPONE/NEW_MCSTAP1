#!/bin/bash
# Database Migration Script for JWT Authentication

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}JWT Authentication Database Migration${NC}"
echo -e "${YELLOW}========================================${NC}"

# Check if PostgreSQL is running
echo -e "\n${YELLOW}Checking PostgreSQL connection...${NC}"

psql -U postgres -h localhost -c "\q" 2>/dev/null

if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Cannot connect to PostgreSQL${NC}"
    echo "Make sure PostgreSQL is running on localhost"
    exit 1
fi

echo -e "${GREEN}✓ PostgreSQL is running${NC}"

# Create database if not exists
echo -e "\n${YELLOW}Creating database...${NC}"

createdb -U postgres sap_automation 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database created${NC}"
else
    echo -e "${GREEN}✓ Database already exists${NC}"
fi

# Run migration script
echo -e "\n${YELLOW}Running authentication schema migration...${NC}"

psql -U postgres -h localhost -d sap_automation -f db/auth_schema.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Schema migration completed${NC}"
else
    echo -e "${RED}ERROR: Schema migration failed${NC}"
    exit 1
fi

# Verify tables were created
echo -e "\n${YELLOW}Verifying tables...${NC}"

psql -U postgres -h localhost -d sap_automation -c "
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
" | tail -n +3 | head -n -1 | while read table; do
    if [ ! -z "$table" ]; then
        echo -e "${GREEN}✓ Table: $table${NC}"
    fi
done

# Verify default data
echo -e "\n${YELLOW}Checking default data...${NC}"

ADMIN_COUNT=$(psql -U postgres -h localhost -d sap_automation -t -c "SELECT COUNT(*) FROM users WHERE username = 'admin';")
ROLE_COUNT=$(psql -U postgres -h localhost -d sap_automation -t -c "SELECT COUNT(*) FROM roles;")
PERM_COUNT=$(psql -U postgres -h localhost -d sap_automation -t -c "SELECT COUNT(*) FROM permissions;")

echo -e "${GREEN}✓ Admin users: $ADMIN_COUNT${NC}"
echo -e "${GREEN}✓ Roles: $ROLE_COUNT${NC}"
echo -e "${GREEN}✓ Permissions: $PERM_COUNT${NC}"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Migration completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${YELLOW}Default Credentials:${NC}"
echo -e "  Username: ${GREEN}admin${NC}"
echo -e "  Password: ${GREEN}admin123${NC}"

echo -e "\n${YELLOW}Next steps:${NC}"
echo "  1. pip install -r requirements.txt"
echo "  2. Configure .env file"
echo "  3. Start backend: cd api && uvicorn main:app --reload"
echo "  4. Start frontend: cd frontend-next && npm run dev"

exit 0
