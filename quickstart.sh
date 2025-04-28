#!/bin/bash

# Colors for output formatting
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'

# Default to not actually executing potentially destructive commands
DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
  DRY_RUN=true
  echo -e "${YELLOW}Running in dry-run mode. No changes will be made.${NC}"
fi

# Function to create directory if it doesn't exist
create_dir_if_not_exists() {
  if [ ! -d "$1" ]; then
    echo "Creating directory: $1"
    if [ "$DRY_RUN" = false ]; then
      mkdir -p "$1"
    fi
  fi
}

# Print header
echo -e "${BLUE}=================================${NC}"
echo -e "${BLUE}  Library Management System Setup ${NC}"
echo -e "${BLUE}=================================${NC}"
echo ""

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check for required dependencies
echo -e "${YELLOW}Checking required dependencies...${NC}"

# Check for Node.js
if ! command_exists node; then
  echo -e "${RED}Node.js is not installed. Please install Node.js (v14 or higher) before continuing.${NC}"
  echo "Visit https://nodejs.org/ to download and install."
  exit 1
else
  NODE_VERSION=$(node -v)
  echo -e "${GREEN}✓ Node.js ${NODE_VERSION} is installed${NC}"
fi

# Check for npm
if ! command_exists npm; then
  echo -e "${RED}npm is not installed. Please install npm before continuing.${NC}"
  exit 1
else
  NPM_VERSION=$(npm -v)
  echo -e "${GREEN}✓ npm ${NPM_VERSION} is installed${NC}"
fi

# Check for MySQL
if ! command_exists mysql; then
  echo -e "${RED}MySQL is not installed. Please install MySQL before continuing.${NC}"
  echo "Visit https://dev.mysql.com/downloads/ to download and install MySQL."
  exit 1
else
  echo -e "${GREEN}✓ MySQL is installed${NC}"
fi

echo ""
echo -e "${YELLOW}Installing dependencies...${NC}"

# Install server dependencies
echo "Installing server dependencies..."
if [ "$DRY_RUN" = false ]; then
  npm install
fi

# Create server directory if it doesn't exist
create_dir_if_not_exists "./server"

# Install client dependencies
echo "Installing client dependencies..."
if [ "$DRY_RUN" = false ]; then
  cd client && npm install --legacy-peer-deps && cd ..
else
  echo "(Dry run: would install client dependencies with --legacy-peer-deps)"
fi

# Create server/.env file if it doesn't exist
echo ""
echo -e "${YELLOW}Setting up environment variables...${NC}"

create_dir_if_not_exists "./server"

if [ ! -f "./server/.env" ] || [ "$DRY_RUN" = true ]; then
  echo "Creating server/.env file..."
  
  # Prompt for MySQL credentials
  echo -e "${BLUE}Please enter your MySQL credentials:${NC}"
  read -p "MySQL Host (default: localhost): " DB_HOST
  DB_HOST=${DB_HOST:-localhost}
  
  read -p "MySQL Username (default: root): " DB_USER
  DB_USER=${DB_USER:-root}
  
  read -p "MySQL Password: " DB_PASSWORD
  
  read -p "MySQL Database Name (default: library_management): " DB_NAME
  DB_NAME=${DB_NAME:-library_management}
  
  # Generate random JWT secret
  JWT_SECRET=$(openssl rand -hex 16)
  
  # Create .env file
  if [ "$DRY_RUN" = false ]; then
    cat > ./server/.env << EOF
DB_HOST=${DB_HOST}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
JWT_SECRET=${JWT_SECRET}
PORT=5000
EOF
    echo -e "${GREEN}✓ Environment file created at ./server/.env${NC}"
  else
    echo -e "${YELLOW}(Dry run: would create .env file with the provided credentials)${NC}"
  fi
else
  echo -e "${GREEN}✓ Environment file already exists${NC}"
fi

# Create database and load schema if it doesn't exist
echo ""
echo -e "${YELLOW}Setting up database...${NC}"

# Source environment variables if the file exists
if [ -f "./server/.env" ]; then
  source <(grep -v '^#' ./server/.env | sed 's/^/export /')
else
  # Use the entered values if in dry run mode
  export DB_HOST=${DB_HOST:-localhost}
  export DB_USER=${DB_USER:-root}
  export DB_PASSWORD=${DB_PASSWORD:-""}
  export DB_NAME=${DB_NAME:-library_management}
fi

# Check MySQL connection and create database if needed
echo "Checking MySQL connection..."
if [ "$DRY_RUN" = false ]; then
  if mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME" 2>/dev/null; then
    echo -e "${GREEN}✓ Database '$DB_NAME' already exists${NC}"
  else
    echo "Creating database '$DB_NAME'..."
    if mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null; then
      echo -e "${GREEN}✓ Database created successfully${NC}"
    else
      echo -e "${RED}Failed to create database. Please check your MySQL credentials.${NC}"
      exit 1
    fi
  fi
else
  echo -e "${YELLOW}(Dry run: would check/create database '$DB_NAME')${NC}"
fi

# Load database schema and sample data
echo "Loading database schema and sample data..."
if [ "$DRY_RUN" = false ]; then
  if [ -f "./setup-database.sql" ]; then
    if mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < ./setup-database.sql 2>/dev/null; then
      echo -e "${GREEN}✓ Database schema and sample data loaded successfully${NC}"
    else
      echo -e "${RED}Failed to load database schema and sample data. Please check your MySQL credentials.${NC}"
      exit 1
    fi
  else
    echo -e "${RED}setup-database.sql file not found.${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}(Dry run: would load database schema and sample data)${NC}"
fi

# Success message
echo ""
echo -e "${GREEN}=====================================================${NC}"
echo -e "${GREEN} Setup completed successfully!${NC}"
echo -e "${GREEN}=====================================================${NC}"
echo ""
echo -e "To start the application, run: ${BLUE}npm run dev${NC}"
echo ""
echo -e "Access the application at:"
echo -e "- Frontend: ${BLUE}http://localhost:3000${NC}"
echo -e "- Backend API: ${BLUE}http://localhost:5000${NC}"
echo ""
echo -e "${YELLOW}Default Login Credentials:${NC}"
echo -e "Admin Account:"
echo -e "- Email: ${BLUE}admin@library.com${NC}"
echo -e "- Password: ${BLUE}password123${NC}"
echo ""
echo -e "Sample Member Account:"
echo -e "- Email: ${BLUE}john.doe@email.com${NC}"
echo -e "- Password: ${BLUE}password123${NC}"
echo ""

if [ "$DRY_RUN" = false ]; then
  echo -e "Would you like to start the application now? (y/n)"
  read -r START_APP

  if [[ "$START_APP" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Starting the application...${NC}"
    npm run dev
  else
    echo -e "${YELLOW}You can start the application later by running:${NC} ${BLUE}npm run dev${NC}"
  fi
else
  echo -e "${YELLOW}Dry run completed. No changes were made.${NC}"
fi