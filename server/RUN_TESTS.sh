#!/bin/bash

# Restaurant Reservation System - Test Runner Script
# This script provides a convenient way to run the test suite

set -e

echo "🧪 Restaurant Reservation System - Test Suite"
echo "=============================================="
echo ""

# Check if MongoDB is running
check_mongodb() {
  if ! command -v mongosh &> /dev/null && ! command -v mongo &> /dev/null; then
    echo "⚠️  MongoDB client not found, but continuing..."
    echo "    Make sure MongoDB is running on localhost:27017"
    return
  fi

  if mongosh --eval "db.version()" &>/dev/null || mongo --eval "db.version()" &>/dev/null; then
    echo "✅ MongoDB is running"
  else
    echo "⚠️  Could not connect to MongoDB"
    echo "    Make sure MongoDB is running on localhost:27017"
  fi
}

# Check Node.js version
check_node() {
  NODE_VERSION=$(node -v)
  echo "✅ Node.js version: $NODE_VERSION"
}

# Install dependencies if needed
install_deps() {
  if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Installing dependencies..."
    npm install
  fi
}

# Run tests based on argument
run_tests() {
  local TEST_TYPE=${1:-all}

  case $TEST_TYPE in
    all)
      echo ""
      echo "🏃 Running all 176 tests..."
      npm test
      ;;
    watch)
      echo ""
      echo "👀 Running tests in watch mode..."
      echo "Press 'q' to quit"
      npm run test:watch
      ;;
    coverage)
      echo ""
      echo "📊 Running tests with coverage report..."
      npm run test:coverage
      echo ""
      echo "📈 Coverage report generated in ./coverage/"
      ;;
    booking)
      echo ""
      echo "🔐 Running booking logic tests (62 tests)..."
      npm test booking.test.js
      ;;
    auth)
      echo ""
      echo "🔑 Running auth tests (29 tests)..."
      npm test auth.test.js
      ;;
    reservations)
      echo ""
      echo "🍽️  Running reservations API tests (35 tests)..."
      npm test reservations.api.test.js
      ;;
    tables)
      echo ""
      echo "📋 Running tables API tests (50 tests)..."
      npm test tables.api.test.js
      ;;
    *)
      echo "Unknown test type: $TEST_TYPE"
      echo ""
      echo "Usage: ./RUN_TESTS.sh [all|watch|coverage|booking|auth|reservations|tables]"
      echo ""
      echo "Examples:"
      echo "  ./RUN_TESTS.sh               # Run all tests"
      echo "  ./RUN_TESTS.sh watch         # Watch mode"
      echo "  ./RUN_TESTS.sh coverage      # With coverage report"
      echo "  ./RUN_TESTS.sh booking       # Only booking logic tests"
      echo "  ./RUN_TESTS.sh auth          # Only auth tests"
      exit 1
      ;;
  esac
}

# Main execution
main() {
  echo "Checking prerequisites..."
  check_node
  check_mongodb
  echo ""

  install_deps

  run_tests "$@"
}

# Run main function
main "$@"
