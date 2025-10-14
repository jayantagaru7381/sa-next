#!/bin/bash
# Setup script for multi-environment deployment strategy
# This script helps configure the required Azure Static Web Apps tokens and GitHub settings

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Azure CLI is installed
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is not installed. Please install it first."
        echo "  Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        exit 1
    fi
    
    # Check if GitHub CLI is installed
    if ! command -v gh &> /dev/null; then
        log_warning "GitHub CLI is not installed. Some features will be limited."
        echo "  To install: https://github.com/cli/cli#installation"
    fi
    
    # Check if logged in to Azure
    if ! az account show &> /dev/null; then
        log_error "Not logged in to Azure. Please run 'az login' first."
        exit 1
    fi
    
    log_success "Prerequisites check completed"
}

# Get Azure Static Web Apps deployment tokens
get_deployment_tokens() {
    log_info "Getting Azure Static Web Apps deployment tokens..."
    
    # Default values - update these for your setup
    RESOURCE_GROUP_QA="wb-overhaul-rg"
    RESOURCE_GROUP_PREVIEW="wb-overhaul-rg"
    STATIC_APP_QA="wb-overhaul-qa"
    STATIC_APP_PREVIEW="wb-overhaul"
    
    echo ""
    echo "Please provide your Azure Static Web Apps information:"
    read -p "Resource Group for QA environment [$RESOURCE_GROUP_QA]: " rg_qa
    RESOURCE_GROUP_QA=${rg_qa:-$RESOURCE_GROUP_QA}
    
    read -p "Static Web App name for QA [$STATIC_APP_QA]: " swa_qa
    STATIC_APP_QA=${swa_qa:-$STATIC_APP_QA}
    
    read -p "Resource Group for Preview environment [$RESOURCE_GROUP_PREVIEW]: " rg_preview
    RESOURCE_GROUP_PREVIEW=${rg_preview:-$RESOURCE_GROUP_PREVIEW}
    
    read -p "Static Web App name for Preview [$STATIC_APP_PREVIEW]: " swa_preview
    STATIC_APP_PREVIEW=${swa_preview:-$STATIC_APP_PREVIEW}
    
    echo ""
    log_info "Retrieving deployment tokens..."
    
    # Get QA deployment token
    log_info "Getting QA deployment token for $STATIC_APP_QA..."
    QA_TOKEN=$(az staticwebapp secrets list \
        --name "$STATIC_APP_QA" \
        --resource-group "$RESOURCE_GROUP_QA" \
        --query "properties.apiKey" \
        --output tsv)
    
    if [ -z "$QA_TOKEN" ]; then
        log_error "Failed to retrieve QA deployment token"
        exit 1
    fi
    
    # Get Preview deployment token
    log_info "Getting Preview deployment token for $STATIC_APP_PREVIEW..."
    PREVIEW_TOKEN=$(az staticwebapp secrets list \
        --name "$STATIC_APP_PREVIEW" \
        --resource-group "$RESOURCE_GROUP_PREVIEW" \
        --query "properties.apiKey" \
        --output tsv)
    
    if [ -z "$PREVIEW_TOKEN" ]; then
        log_error "Failed to retrieve Preview deployment token"
        exit 1
    fi
    
    log_success "Successfully retrieved deployment tokens"
    
    # Save tokens to file for manual setup
    cat > deployment-tokens.txt << EOF
# Azure Static Web Apps Deployment Tokens
# Add these as GitHub repository secrets

AZURE_STATIC_WEB_APPS_API_TOKEN_QA=$QA_TOKEN
AZURE_STATIC_WEB_APPS_API_TOKEN=$PREVIEW_TOKEN  # For preview environments
EOF
    
    log_success "Tokens saved to deployment-tokens.txt"
    log_warning "Please add these tokens as GitHub repository secrets manually"
    log_warning "NEVER commit the deployment-tokens.txt file to version control!"
}

# Setup GitHub secrets (if GitHub CLI is available)
setup_github_secrets() {
    if ! command -v gh &> /dev/null; then
        log_warning "GitHub CLI not available. Please set up secrets manually."
        return
    fi
    
    log_info "Setting up GitHub repository secrets..."
    
    # Check if authenticated
    if ! gh auth status &> /dev/null; then
        log_warning "Not authenticated with GitHub. Please run 'gh auth login' first."
        return
    fi
    
    # Get repository info
    REPO_INFO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")
    if [ -z "$REPO_INFO" ]; then
        log_warning "Not in a GitHub repository or unable to detect repository"
        return
    fi
    
    log_info "Setting up secrets for repository: $REPO_INFO"
    
    # Set QA token
    if [ ! -z "$QA_TOKEN" ]; then
        echo "$QA_TOKEN" | gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN_QA
        log_success "Set AZURE_STATIC_WEB_APPS_API_TOKEN_QA"
    fi
    
    # Set Preview token
    if [ ! -z "$PREVIEW_TOKEN" ]; then
        echo "$PREVIEW_TOKEN" | gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN
        log_success "Set AZURE_STATIC_WEB_APPS_API_TOKEN"
    fi
    
}

# Create QA branch
setup_qa_branch() {
    log_info "Setting up QA branch..."
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "Not in a git repository"
        exit 1
    fi
    
    # Check if QA branch exists
    if git show-ref --verify --quiet refs/heads/qa; then
        log_warning "QA branch already exists locally"
    else
        log_info "Creating QA branch from main..."
        git checkout main 2>/dev/null || git checkout master 2>/dev/null
        git pull
        git checkout -b qa
        git push -u origin qa
        log_success "Created and pushed QA branch"
    fi
    
    # Switch back to main/master
    git checkout main 2>/dev/null || git checkout master 2>/dev/null
    log_success "QA branch setup completed"
}

# Setup GitHub environments (manual instructions)
show_github_env_instructions() {
    log_info "GitHub Environment Setup Instructions"
    echo ""
    echo "Please set up the following GitHub environments manually:"
    echo ""
    echo "1. Go to your GitHub repository → Settings → Environments"
    echo ""
    echo "2. Create these environments:"
    echo "   - Environment name: 'preview'"
    echo "     • No protection rules needed"
    echo "     • Used for automatic PR deployments"
    echo ""
    echo "   - Environment name: 'qa'"
    echo "     • Required reviewers: Add your QA team members (optional)"
    echo "     • Used for controlled QA deployments"
    echo ""
    echo "3. For each environment, optionally set:"
    echo "   • Deployment branches: Restrict which branches can deploy"
    echo "   • Environment secrets: Environment-specific configuration"
    echo ""
}

# Show next steps
show_next_steps() {
    log_info "Setup completed! Next steps:"
    echo ""
    echo "1. Configure GitHub Environments (see instructions above)"
    echo "2. Update your Next.js configuration for environment-specific builds"
    echo "3. Test the preview environment by creating a PR"
    echo "4. Deploy to QA using the manual workflow"
    echo ""
    log_success "Your multi-environment deployment strategy is ready!"
}

# Main execution
main() {
    log_info "Azure Static Web Apps Multi-Environment Setup"
    echo "============================================"
    echo ""
    
    check_prerequisites
    echo ""
    
    get_deployment_tokens
    echo ""
    
    setup_github_secrets
    echo ""
    
    setup_qa_branch
    echo ""
    
    show_github_env_instructions
    echo ""
    
    show_next_steps
}

# Execute main function
main "$@"