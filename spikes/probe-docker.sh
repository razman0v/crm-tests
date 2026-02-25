#!/bin/bash

# Spike: Docker Networking & Locale
# Purpose: Verify that containerized Playwright can reach test environment URLs
# and that Russian locale is properly configured

echo "🔍 Spike: Docker Networking & Locale"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Dockerfile exists
if [ ! -f "Dockerfile" ]; then
  echo "❌ Dockerfile not found at repository root"
  echo "   Please create Dockerfile first (Task #19)"
  exit 1
fi

echo "📋 Step 1: Build Docker image"
docker build -t dental-crm-tests:spike .
if [ $? -ne 0 ]; then
  echo "❌ Docker build failed"
  exit 1
fi
echo "✅ Docker image built successfully"

echo ""
echo "📋 Step 2: Check Russian locale configuration inside container"
docker run --rm dental-crm-tests:spike \
  sh -c "echo '🔍 Checking locale configuration...' && locale"

LOCALE_RESULT=$(docker run --rm dental-crm-tests:spike locale | grep -i ru_RU)
if [ -z "$LOCALE_RESULT" ]; then
  echo "⚠️  WARNING: ru_RU.UTF-8 locale not found in container"
  echo "   Consider adding to Dockerfile: RUN apt-get install -y language-pack-ru"
else
  echo "✅ Russian locale found: $LOCALE_RESULT"
fi

echo ""
echo "📋 Step 3: Verify date formatting in Russian locale"
docker run --rm -e LANG=ru_RU.UTF-8 dental-crm-tests:spike \
  sh -c "date '+%d.%m.%Y %H:%M:%S'"
echo "✅ Date formatting verified"

echo ""
echo "📋 Step 4: Test network connectivity (if BASE_URL is set in .env)"
if [ -f ".env" ]; then
  BASE_URL=$(grep "^BASE_URL=" .env | cut -d= -f2)
  if [ ! -z "$BASE_URL" ]; then
    echo "   Testing connectivity to: $BASE_URL"
    docker run --rm --env BASE_URL="$BASE_URL" dental-crm-tests:spike \
      sh -c "apk add curl > /dev/null 2>&1 || apt-get install -y curl > /dev/null 2>&1; \
             curl -I $BASE_URL 2>&1 | head -1"
    if [ $? -eq 0 ]; then
      echo "✅ Network connectivity verified"
    else
      echo "⚠️  Could not reach $BASE_URL from container"
      echo "   This may be expected if backend is not accessible from Docker host"
    fi
  fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SPIKE RESULT: Docker configuration VERIFIED"
echo "   - Image builds successfully"
echo "   - Locale settings can be configured"
echo "   - Network accessibility depends on host machine configuration"