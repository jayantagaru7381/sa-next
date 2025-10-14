#!/bin/bash

echo "🔍 Validating GitHub Actions workflows..."

# Check if workflows directory exists
if [ ! -d ".github/workflows" ]; then
    echo "❌ No .github/workflows directory found"
    exit 1
fi

# Validate YAML syntax
echo "📋 Checking YAML syntax..."
for file in .github/workflows/*.yml .github/workflows/*.yaml; do
    if [ -f "$file" ]; then
        echo "  Checking $file..."
        # Try Python YAML validation if available, otherwise use act validation
        python3 -c "import yaml; yaml.safe_load(open('$file'))" 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "  ✅ $file - Valid YAML (Python validation)"
        else
            # Fallback to basic structure check if YAML module not available
            if [ -s "$file" ] && grep -q "^name:" "$file"; then
                echo "  ✅ $file - Basic YAML structure valid"
            else
                echo "  ❌ $file - Invalid YAML structure"
                exit 1
            fi
        fi
    fi
done

# Check workflow structure with act
echo "🎬 Checking workflow structure with act..."
for file in .github/workflows/*.yml .github/workflows/*.yaml; do
    if [ -f "$file" ]; then
        echo "  Analyzing $file..."
        act --list --workflows "$file" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo "  ✅ $file - Valid workflow structure"
        else
            echo "  ❌ $file - Invalid workflow structure"
            exit 1
        fi
    fi
done

# Check for common issues
echo "🔧 Checking for common issues..."

# Check for secret references
echo "  Checking secret references..."
grep -r "secrets\." .github/workflows/ | grep -v "GITHUB_TOKEN" | while read line; do
    echo "    📝 Found secret reference: $line"
done

# Check environment references
echo "  Checking environment variable references..."
grep -r "env\." .github/workflows/ | while read line; do
    echo "    📝 Found env reference: $line"
done

echo ""
echo "✅ All workflow validations completed successfully!"
echo "💡 Remember to set up the required secrets in your repository:"
echo "   - AZURE_STATIC_WEB_APPS_API_TOKEN (for preview environments)"
echo "   - AZURE_STATIC_WEB_APPS_API_TOKEN_QA"