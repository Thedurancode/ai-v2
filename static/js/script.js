document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const aiSearchButton = document.getElementById('ai-search-button');
    const loader = document.getElementById('loader');
    const resultsContainer = document.getElementById('results-container');
    const analysisContent = document.getElementById('analysis-content');
    const sourcesContent = document.getElementById('sources-content');
    const industryHeader = document.getElementById('industry-header');
    const companiesGrid = document.getElementById('companies-grid');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const modal = document.getElementById('company-modal');
    const modalBody = document.getElementById('modal-body');
    const closeModal = document.querySelector('.close-modal');

    // Create history tracker
    createHistoryTracker();
    
    // Load search history initially
    loadSearchHistory();

    // Set up tab handling
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            showTab(tabId);
        });
    });

    // Store the analysis data globally
    let currentAnalysisData = null;
    let scoringCriteria = null;
    let maxTotalScore = 0;

    // Handle search
    const handleSearch = async () => {
        const query = searchInput.value.trim();
        
        if (!query) {
            searchInput.focus();
            return;
        }
        
        // Show loader, hide results
        loader.style.display = 'flex';
        resultsContainer.style.display = 'none';
        
        // Reset any previous errors
        document.querySelectorAll('.error-message').forEach(el => el.remove());
        
        // Create or update the progress container inside the loader
        let progressContainer = document.getElementById('progress-container');
        if (!progressContainer) {
            progressContainer = document.createElement('div');
            progressContainer.id = 'progress-container';
            progressContainer.classList.add('progress-container');
            loader.appendChild(progressContainer);
        }
        
        progressContainer.innerHTML = `
            <div class="progress-steps">
                <div class="progress-step" data-step="searching">
                    <div class="step-icon">🔍</div>
                    <div class="step-label">Searching</div>
                </div>
                <div class="progress-step" data-step="extracting">
                    <div class="step-icon">📋</div>
                    <div class="step-label">Extracting Companies</div>
                </div>
                <div class="progress-step" data-step="analyzing">
                    <div class="step-icon">🧠</div>
                    <div class="step-label">Analyzing</div>
                </div>
                <div class="progress-step" data-step="enriching">
                    <div class="step-icon">✨</div>
                    <div class="step-label">Enriching Data</div>
                </div>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar-fill" style="width: 0%"></div>
            </div>
            <div class="progress-message">Initiating search...</div>
        `;
        
        let searchPromise;
        
        try {
            // Start the search request
            searchPromise = fetch('/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query }),
            });
            
            // Poll for status updates while the search is running
            let completed = false;
            let lastStep = '';
            let errorDetected = false;
            let searchData = null;
            
            // Set a timeout for the entire operation
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("Search operation timed out after 120 seconds")), 120000);
            });
            
            while (!completed && !errorDetected) {
                try {
                    const statusResponse = await Promise.race([
                        fetch('/search-status'),
                        timeoutPromise
                    ]);
                    
                    if (!statusResponse.ok) {
                        errorDetected = true;
                        throw new Error(`Failed to get search status: ${statusResponse.status} ${statusResponse.statusText}`);
                    }
                    
                    const status = await statusResponse.json();
                    updateProgressUI(status);
                    
                    // Record if this is a step change
                    if (status.current_step !== lastStep) {
                        lastStep = status.current_step;
                        console.log(`Step changed to: ${status.current_step} - ${status.message}`);
                    }
                    
                    completed = status.completed;
                    errorDetected = status.current_step === 'error';
                    
                    if (errorDetected) {
                        throw new Error(status.message || "An error occurred during the search process");
                    }
                    
                    if (!completed && !errorDetected) {
                        // Wait before polling again - increased from 500ms to 2000ms
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                } catch (statusError) {
                    console.error("Error checking status:", statusError);
                    errorDetected = true;
                    throw statusError;
                }
            }
            
            // Now wait for the actual search results
            const searchResponse = await Promise.race([searchPromise, timeoutPromise]);
            
            if (!searchResponse.ok) {
                throw new Error(`Search failed with status: ${searchResponse.status} ${searchResponse.statusText}`);
            }
            
            // Parse the response data
            try {
                searchData = await searchResponse.json();
            } catch (parseError) {
                console.error("Error parsing search results:", parseError);
                throw new Error("Failed to parse search results from server");
            }
            
            // Validate the data
            if (!isValidData(searchData)) {
                throw new Error("Received invalid data structure from server");
            }
            
            // Store the analysis data globally
            currentAnalysisData = searchData.analysis;
            scoringCriteria = searchData.scoring_criteria;
            maxTotalScore = searchData.max_total_score;
            
            // Process and display the results
            displayResults(searchData, query);
            
        } catch (error) {
            console.error('Search error:', error);
            analysisContent.innerHTML = `
                <div class="error-message">
                    <h3>Search Error</h3>
                    <p>Sorry, something went wrong with your search. Please try again later.</p>
                    <p class="error-details">${error.message}</p>
                </div>
            `;
            
            // Make sure the results container is visible to show the error
            resultsContainer.style.display = 'block';
            
            // Update progress UI to show error
            updateProgressUI({
                current_step: 'error',
                message: `Error: ${error.message}`,
                progress: 100,
                completed: true
            });
            
            // Set all tabs to show the error
            industryHeader.innerHTML = `
                <h2>Search Error</h2>
                <p>There was a problem with your search for "${query}".</p>
            `;
            
            companiesGrid.innerHTML = `
                <div class="error-message">
                    <h3>Search Error</h3>
                    <p>We couldn't find any companies matching your search.</p>
                    <p>Error details: ${error.message}</p>
                </div>
            `;
            
            // Show the companies tab by default
            showTab('companies');
            
        } finally {
            // Hide loader after a short delay to ensure the user sees the completed state
            setTimeout(() => {
                if (loader) loader.style.display = 'none';
                if (resultsContainer) resultsContainer.style.display = 'block';
            }, 1000);
        }
    };
    
    // Update the progress UI based on status
    const updateProgressUI = (status) => {
        const progressContainer = document.getElementById('progress-container');
        if (!progressContainer) return;
        
        // Update progress bar
        const progressBarFill = progressContainer.querySelector('.progress-bar-fill');
        if (progressBarFill) {
            progressBarFill.style.width = `${status.progress}%`;
        }
        
        // Update message
        const progressMessage = progressContainer.querySelector('.progress-message');
        if (progressMessage) {
            progressMessage.textContent = status.message;
        }
        
        // Update steps
        const steps = progressContainer.querySelectorAll('.progress-step');
        steps.forEach(step => {
            const stepName = step.getAttribute('data-step');
            
            // Remove all state classes
            step.classList.remove('active', 'completed', 'error');
            
            // Set appropriate state
            if (status.current_step === 'error' && stepName === status.current_step) {
                step.classList.add('error');
            } else if (status.current_step === stepName) {
                step.classList.add('active');
            } else if (
                (stepName === 'searching' && ['extracting', 'analyzing', 'enriching', 'completed'].includes(status.current_step)) ||
                (stepName === 'extracting' && ['analyzing', 'enriching', 'completed'].includes(status.current_step)) ||
                (stepName === 'analyzing' && ['enriching', 'completed'].includes(status.current_step)) ||
                (stepName === 'enriching' && ['completed'].includes(status.current_step))
            ) {
                step.classList.add('completed');
            }
        });
        
        // Add a special error step if needed
        if (status.current_step === 'error' && !progressContainer.querySelector('[data-step="error"]')) {
            const errorStep = document.createElement('div');
            errorStep.classList.add('progress-step', 'error');
            errorStep.setAttribute('data-step', 'error');
            errorStep.innerHTML = `
                <div class="step-icon">❌</div>
                <div class="step-label">Error</div>
            `;
            progressContainer.querySelector('.progress-steps').appendChild(errorStep);
        }
    };

    // Add a utility function to check if data is valid
    const isValidData = (data) => {
        // Check if data exists and has the required structure
        if (!data) {
            console.error("Error: No data received from server");
            return false;
        }
        
        // Check for required fields
        if (!data.industry) {
            console.error("Error: Missing industry in data");
            return false;
        }
        
        if (!data.analysis) {
            console.error("Error: Missing analysis in data");
            return false;
        }
        
        if (!data.analysis.companies || !Array.isArray(data.analysis.companies)) {
            console.error("Error: Missing or invalid companies array in data");
            return false;
        }
        
        return true;
    };

    // Display search results
    const displayResults = (data, query) => {
        // Make sure the results container is visible
        resultsContainer.style.display = 'block';
        
        // Show loading completed indicator
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.display = 'none';
        }
        
        try {
            // Log data to help debugging
            console.log("Received search data:", data);
            
            // Validate data
            if (!isValidData(data)) {
                throw new Error("Invalid data received from server");
            }
            
            // Display the industry header
            industryHeader.innerHTML = `
                <h2>${data.industry} Industry</h2>
                <p>${data.analysis.industry_overview}</p>
            `;
            
            // Display company cards
            displayCompanyCards(data.analysis.companies);
            
            // Format and display the AI analysis
            displayIndustryAnalysis(data.analysis, data.industry);
            
            // Format and display the sources
            displaySources(data.search_results);
            
            // Ensure the first tab is active
            showTab('companies');
        } catch (error) {
            console.error("Error displaying results:", error);
            // Show error message in the results area
            industryHeader.innerHTML = `
                <h2>Error Displaying Results</h2>
                <p>An error occurred while displaying the search results: ${error.message}</p>
            `;
        }
    };
    
    // Display company cards
    const displayCompanyCards = (companies) => {
        console.log("Displaying company cards:", companies ? companies.length : "no companies");
        
        // Check if companies exist
        if (!companies || companies.length === 0) {
            companiesGrid.innerHTML = '<div class="no-results">No companies found. Try a different search query.</div>';
            return;
        }
        
        // Clear previous results
        companiesGrid.innerHTML = '';
        
        try {
            // Sort companies: first by competition status (no competition first), then by score
            const sortedCompanies = [...companies].sort((a, b) => {
                // First sort by competition status
                if (a.competes_with_partners !== b.competes_with_partners) {
                    return a.competes_with_partners ? 1 : -1; // No competition first
                }
                // Then sort by score (highest first)
                return b.total_score - a.total_score;
            });
            
            sortedCompanies.forEach(company => {
                // Scale the score to 1-10 range
                const scaledScore = Math.round((company.total_score / maxTotalScore) * 10);
                
                // Calculate score class based on percentage of max score
                const scorePercentage = (company.total_score / maxTotalScore) * 100;
                let scoreClass, progressClass;
                
                if (scorePercentage >= 75) {
                    scoreClass = 'score-excellent';
                    progressClass = 'progress-excellent';
                } else if (scorePercentage >= 50) {
                    scoreClass = 'score-good';
                    progressClass = 'progress-good';
                } else if (scorePercentage >= 25) {
                    scoreClass = 'score-average';
                    progressClass = 'progress-average';
                } else {
                    scoreClass = 'score-poor';
                    progressClass = 'progress-poor';
                }
                
                // Get top 3 scoring categories
                const topCategories = Object.entries(company.scores || {})
                    .sort((a, b) => (b[1].score / b[1].max) - (a[1].score / a[1].max))
                    .slice(0, 3);
                
                // Generate competition details if company competes with partners
                let competitionDetails = '';
                if (company.competes_with_partners && company.competing_partners && company.competing_partners.length > 0) {
                    competitionDetails = `
                        <div class="competition-details">
                            <div class="competing-partners">
                                <span class="detail-label">Competing with:</span>
                                <span class="detail-value">${company.competing_partners.join(', ')}</span>
                            </div>
                            ${company.competition_reasons ? 
                                `<div class="competition-reason">
                                    <span class="detail-label">Reason:</span>
                                    <span class="detail-value">${truncateText(company.competition_reasons, 100)}</span>
                                </div>` : ''
                            }
                        </div>
                    `;
                }
                
                // Create company card
                const companyCard = document.createElement('div');
                companyCard.className = 'company-card';
                companyCard.dataset.company = company.name;
                
                companyCard.innerHTML = `
                    <div class="company-header">
                        <div class="company-logo-name">
                            <div class="company-logo">
                                <img src="${company.logo || 'https://img.logo.dev/default.com?token=pk_TCK5i8rzR92YmS65BY2fgQ&retina=true'}" alt="${company.name} logo">
                            </div>
                            <h3 class="company-name">${company.name}</h3>
                        </div>
                        <div class="company-status-indicators">
                            <div class="company-competition ${company.competes_with_partners ? 'has-competition' : 'no-competition'}">
                                ${company.competes_with_partners ? 
                                '<i class="fas fa-exclamation-triangle"></i> Competes with partners' : 
                                '<i class="fas fa-check-circle"></i> No competition'}
                            </div>
                            <div class="company-enrichment ${company.enriched ? 'is-enriched' : 'not-enriched'}">
                                ${company.enriched ? 
                                '<i class="fas fa-database"></i> Enhanced with external data' : 
                                '<i class="fas fa-info-circle"></i> Basic data only'}
                            </div>
                        </div>
                    </div>
                    ${competitionDetails}
                    <div class="company-body">
                        <div class="company-description">${truncateText(company.description || 'No description available', 100)}</div>
                        <div class="score-container">
                            <div class="score-circle ${scoreClass}">${scaledScore}</div>
                            <div class="score-info">
                                <div class="score-label">Partnership Score</div>
                                <div class="score-value">${scaledScore}/10</div>
                            </div>
                        </div>
                        <div class="score-breakdown">
                            ${topCategories.map(([key, value]) => {
                                const categoryName = scoringCriteria[key]?.name || key;
                                const percentage = (value.score / value.max) * 100;
                                // Scale category score to 1-10
                                const scaledCategoryScore = Math.round((value.score / value.max) * 10);
                                const scaledMaxScore = 10;
                                return `
                                    <div class="score-category">
                                        <div class="category-header">
                                            <div class="category-name">${categoryName}</div>
                                            <div class="category-score">${scaledCategoryScore}/${scaledMaxScore}</div>
                                        </div>
                                        <div class="progress-bar">
                                            <div class="progress-fill ${progressClass}" style="width: ${percentage}%"></div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
                
                // Add click event to open modal
                companyCard.addEventListener('click', async () => {
                    try {
                        // Show loading state
                        const originalContent = companyCard.innerHTML;
                        companyCard.innerHTML = `<div class="card-loading">Loading company details...</div>`;
                        
                        // Fetch detailed company information from the backend
                        const response = await fetch('/company-details', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(company),
                        });
                        
                        if (!response.ok) {
                            throw new Error(`Failed to fetch company details: ${response.status} ${response.statusText}`);
                        }
                        
                        // Parse the enhanced company data
                        const enhancedCompanyData = await response.json();
                        
                        // Restore original card content
                        companyCard.innerHTML = originalContent;
                        
                        // Merge the enhanced data with the original company data
                        const mergedCompanyData = { ...company, ...enhancedCompanyData };
                        
                        // Open the modal with the enhanced company data
                        openCompanyModal(mergedCompanyData);
                    } catch (error) {
                        console.error("Error fetching company details:", error);
                        
                        // Restore original content and show error
                        companyCard.innerHTML = originalContent;
                        
                        // Just use the existing company data without enhancements
                        openCompanyModal(company);
                    }
                });
                
                companiesGrid.appendChild(companyCard);
            });
        } catch (error) {
            console.error("Error rendering company cards:", error);
            companiesGrid.innerHTML = `<div class="error-message">Error displaying company data: ${error.message}</div>`;
        }
    };
    
    // Display industry analysis
    const displayIndustryAnalysis = (analysis, industry) => {
        // Create suitable partners list
        const suitablePartners = analysis.suitable_partners.map(partner => 
            `<li>${partner}</li>`
        ).join('');
        
        analysisContent.innerHTML = `
            <h2>${industry} Industry Analysis</h2>
            <div class="industry-overview">
                <h3>Industry Overview</h3>
                <p>${analysis.industry_overview}</p>
            </div>
            <div class="suitable-partners-section">
                <h3>Suitable Partnership Candidates</h3>
                ${suitablePartners.length > 0 ? 
                    `<ul class="suitable-partners-list">${suitablePartners}</ul>` : 
                    '<p>No suitable partners found that don\'t compete with existing partners.</p>'
                }
            </div>
        `;
    };
    
    // Display sources
    const displaySources = (searchResults) => {
        let sourcesHTML = '';
        
        if (searchResults && searchResults.length > 0) {
            // Display sources
            sourcesHTML += `<h3>Industry Research Sources</h3>`;
            
            searchResults.forEach((result, index) => {
                sourcesHTML += `
                    <div class="source-item">
                        <div class="source-title">${result.title || 'Source ' + (index + 1)}</div>
                        <a href="${result.url}" target="_blank" class="source-url">${result.url}</a>
                        <div class="source-excerpt">${result.text ? truncateText(result.text, 200) : 'No excerpt available'}</div>
                    </div>
                `;
            });
        } else {
            sourcesHTML = '<p>No sources available</p>';
        }
        
        sourcesContent.innerHTML = sourcesHTML;
    };
    
    // Open company modal
    const openCompanyModal = (company) => {
        // If the company doesn't compete with partners, use LinkedIn-style modal
        if (!company.competes_with_partners) {
            openLinkedInStyleModal(company);
            return;
        }
        
        // Format the company's scores for display (for competing companies)
        const scoreItems = Object.entries(company.scores).map(([key, value]) => {
            const categoryName = scoringCriteria[key].name;
            const percentage = (value.score / value.max) * 100;
            // Scale category score to 1-10
            const scaledCategoryScore = Math.round((value.score / value.max) * 10);
            let scoreClass;
            
            if (percentage >= 75) {
                scoreClass = 'score-excellent';
            } else if (percentage >= 50) {
                scoreClass = 'score-good';
            } else if (percentage >= 25) {
                scoreClass = 'score-average';
            } else {
                scoreClass = 'score-poor';
            }
            
            return `
                <div class="modal-score-item">
                    <div class="modal-score-header">
                        <div class="modal-category-name">${categoryName}</div>
                        <div class="modal-category-score ${scoreClass}">${scaledCategoryScore}/10</div>
                    </div>
                    <div class="modal-progress-bar">
                        <div class="modal-progress-fill ${scoreClass}" style="width: ${percentage}%"></div>
                    </div>
                    <div class="modal-score-explanation">${value.explanation}</div>
                </div>
            `;
        }).join('');
        
        // Create the Coresignal enrichment section if available
        let coresignalSection = '';
        if (company.enriched && company.coresignal_data) {
            const coreData = company.coresignal_data;
            const companyDetails = coreData.company_details || {};
            const employees = coreData.employees || [];
            const funding = coreData.funding || [];
            
            // Format company details
            const foundedYear = companyDetails.founded_year ? companyDetails.founded_year : 'Unknown';
            const size = companyDetails.size ? companyDetails.size : 'Unknown';
            const industry = companyDetails.industry ? companyDetails.industry : 'Unknown';
            const location = companyDetails.location ? companyDetails.location : 'Unknown';
            const website = companyDetails.website ? `<a href="${companyDetails.website}" target="_blank">${companyDetails.website}</a>` : 'Unknown';
            
            // Format top executives (if available)
            let executivesHtml = '';
            if (employees.length > 0) {
                const executives = employees.slice(0, 5); // Show top 5 executives
                executivesHtml = `
                    <div class="coresignal-section">
                        <h4>Key Personnel</h4>
                        <ul class="executives-list">
                            ${executives.map(exec => `
                                <li>
                                    <div class="executive-name">${exec.name || 'Unknown'}</div>
                                    <div class="executive-title">${exec.title || 'Unknown'}</div>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;
            }
            
            // Format funding information (if available)
            let fundingHtml = '';
            if (funding.length > 0) {
                const totalFunding = funding.reduce((sum, round) => sum + (round.amount || 0), 0);
                fundingHtml = `
                    <div class="coresignal-section">
                        <h4>Funding Information</h4>
                        <div class="funding-total">Total Funding: $${totalFunding.toLocaleString()}</div>
                        <ul class="funding-rounds">
                            ${funding.map(round => `
                                <li>
                                    <div class="funding-date">${round.date || 'Unknown'}</div>
                                    <div class="funding-type">${round.type || 'Unknown'}</div>
                                    <div class="funding-amount">$${(round.amount || 0).toLocaleString()}</div>
                                    <div class="funding-investors">${round.investors || 'Unknown'}</div>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;
            }
            
            coresignalSection = `
                <div class="coresignal-data">
                    <h3>Enhanced Company Data <span class="data-source">via Coresignal</span></h3>
                    <div class="coresignal-overview">
                        <div class="coresignal-item">
                            <div class="item-label">Founded</div>
                            <div class="item-value">${foundedYear}</div>
                        </div>
                        <div class="coresignal-item">
                            <div class="item-label">Company Size</div>
                            <div class="item-value">${size}</div>
                        </div>
                        <div class="coresignal-item">
                            <div class="item-label">Industry</div>
                            <div class="item-value">${industry}</div>
                        </div>
                        <div class="coresignal-item">
                            <div class="item-label">Location</div>
                            <div class="item-value">${location}</div>
                        </div>
                        <div class="coresignal-item">
                            <div class="item-label">Website</div>
                            <div class="item-value">${website}</div>
                        </div>
                    </div>
                    ${executivesHtml}
                    ${fundingHtml}
                </div>
            `;
        }
        
        // Create competing partners section with logos
        let competingPartnersSection = '';
        if (company.competes_with_partners) {
            // Check if we have enhanced partner details with logos
            if (company.competing_partners_details && company.competing_partners_details.length > 0) {
                competingPartnersSection = `
                    <div class="modal-competing-partners">
                        <h3>Competing Partners</h3>
                        <p>This company may compete with the following existing partners:</p>
                        <div class="competing-partners-grid">
                            ${company.competing_partners_details.map(partner => `
                                <div class="competing-partner-card">
                                    <div class="competing-partner-logo">
                                        <img src="${partner.logo}" alt="${partner.name} logo" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                                        <div class="partner-logo-fallback" style="display:none;align-items:center;justify-content:center;width:100%;height:100%;background:rgba(255,255,255,0.1);color:white;font-weight:bold;">
                                            ${partner.name.substring(0, 2).toUpperCase()}
                                        </div>
                                    </div>
                                    <div class="competing-partner-name">${partner.name}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            } 
            // Fallback to simple list if we don't have enhanced details
            else if (company.competing_partners && company.competing_partners.length > 0) {
                competingPartnersSection = `
                    <div class="modal-competing-partners">
                        <h3>Competing Partners</h3>
                        <p>This company may compete with the following existing partners:</p>
                        <ul class="competing-partners-list">
                            ${company.competing_partners.map(partner => `<li class="competing-partner-item">${partner}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }
        }
        
        // Create the modal content
        modalBody.innerHTML = `
            <div class="modal-company-header">
                <div class="modal-company-logo">
                    <img src="${company.logo}" alt="${company.name} logo">
                </div>
                <div class="modal-company-info">
                    <h2 class="modal-company-name">${company.name}</h2>
                    <div class="modal-company-competition ${company.competes_with_partners ? 'has-competition' : 'no-competition'}">
                        ${company.competes_with_partners ? 
                          '<i class="fas fa-exclamation-triangle"></i> Competes with partners' : 
                          '<i class="fas fa-check-circle"></i> No competition with existing partners'}
                    </div>
                </div>
            </div>
            <div class="modal-company-description">${company.description}</div>
            
            ${coresignalSection}
            
            <div class="modal-score-section">
                <h3>Partnership Fit Analysis</h3>
                <div class="modal-total-score">
                    <div class="modal-score-circle">${Math.round((company.total_score / maxTotalScore) * 10)}</div>
                    <div class="modal-score-label">
                        <div>Partnership Score</div>
                        <div class="score-scale">${Math.round((company.total_score / maxTotalScore) * 10)}/10</div>
                    </div>
                </div>
                <div class="modal-score-breakdown">
                    ${scoreItems}
                </div>
            </div>
            
            <div class="modal-partner-fit">
                <h3>Partnership Fit Summary</h3>
                <div class="modal-fit-content">${formatMarkdown(company.partnership_fit)}</div>
            </div>
            
            ${competingPartnersSection}
        `;
        
        // Show the modal
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    };
    
    // Open LinkedIn-style modal for non-competing companies
    const openLinkedInStyleModal = (company) => {
        // Add LinkedIn-style class to modal
        modal.classList.add('linkedin-modal');
        
        // Check if LinkedIn data is not available
        if (company.linkedin_data && company.linkedin_data.not_available) {
            // Display the "LinkedIn data not available" message
            modalBody.innerHTML = `
                <div class="modal-close">&times;</div>
                <div class="modal-header-banner"></div>
                <div class="modal-company-logo">
                    <img src="${company.logo}" alt="${company.name} logo">
                </div>
                <div class="modal-company-header">
                    <h2 class="modal-company-name">${company.name}</h2>
                    <div class="modal-company-tagline">${company.industry || 'Company'}</div>
                </div>
                
                <div class="linkedin-data-unavailable">
                    <div class="unavailable-icon"><i class="fas fa-exclamation-circle"></i></div>
                    <div class="unavailable-message">${company.linkedin_data.message}</div>
                </div>
                
                <div class="modal-section">
                    <div class="section-title"><i class="fas fa-building"></i> About</div>
                    <div class="modal-company-description">${company.description}</div>
                </div>
            `;
            
            // Add event listener for the close button
            setTimeout(() => {
                document.querySelector('.modal-close').addEventListener('click', () => {
                    modal.style.display = 'none';
                    document.body.style.overflow = 'auto'; // Enable scrolling
                    modal.classList.remove('linkedin-modal'); // Remove LinkedIn class
                });
            }, 100);
            
            // Show the modal
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent scrolling
            return;
        }
        
        // Scale the score to 1-10 range
        const scaledScore = Math.round((company.total_score / maxTotalScore) * 10);
        
        // Calculate score class based on percentage of max score
        const scorePercentage = (company.total_score / maxTotalScore) * 100;
        let scoreClass;
        
        if (scorePercentage >= 75) {
            scoreClass = 'score-excellent';
        } else if (scorePercentage >= 50) {
            scoreClass = 'score-good';
        } else if (scorePercentage >= 25) {
            scoreClass = 'score-average';
        } else {
            scoreClass = 'score-poor';
        }
        
        // Get company industry or category
        const industry = company.industry || company.category || "Technology";
        
        // Format company location
        const location = company.location || "Toronto, Ontario, Canada";
        
        // Format company size
        const size = company.size || "51-200 employees";
        
        // Get Coresignal data if available
        let coresignalSection = '';
        if (company.enriched && company.coresignal_data) {
            const coreData = company.coresignal_data;
            const companyDetails = coreData.company_details || {};
            const employees = coreData.employees || [];
            const funding = coreData.funding || [];
            
            // Format company details
            const foundedYear = companyDetails.founded_year ? companyDetails.founded_year : 'Unknown';
            const companySize = companyDetails.size ? companyDetails.size : size;
            const companyIndustry = companyDetails.industry ? companyDetails.industry : industry;
            const companyLocation = companyDetails.location ? companyDetails.location : location;
            const website = companyDetails.website ? `<a href="${companyDetails.website}" target="_blank">${companyDetails.website}</a>` : 'Unknown';
            
            // Format top executives (if available)
            let executivesHtml = '';
            if (employees.length > 0) {
                const executives = employees.slice(0, 5); // Show top 5 executives
                executivesHtml = `
                    <div class="modal-section">
                        <div class="section-title"><i class="fas fa-users"></i> Key Personnel</div>
                        <ul class="executives-list">
                            ${executives.map(exec => `
                                <li>
                                    <div class="executive-name">${exec.name || 'Unknown'}</div>
                                    <div class="executive-title">${exec.title || 'Unknown'}</div>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;
            }
            
            // Format funding information (if available)
            let fundingHtml = '';
            if (funding.length > 0) {
                const totalFunding = funding.reduce((sum, round) => sum + (round.amount || 0), 0);
                fundingHtml = `
                    <div class="modal-section">
                        <div class="section-title"><i class="fas fa-chart-line"></i> Funding Information</div>
                        <div class="funding-total">Total Funding: $${totalFunding.toLocaleString()}</div>
                        <ul class="funding-rounds">
                            ${funding.map(round => `
                                <li>
                                    <div class="funding-date">${round.date || 'Unknown'}</div>
                                    <div class="funding-type">${round.type || 'Unknown'}</div>
                                    <div class="funding-amount">$${(round.amount || 0).toLocaleString()}</div>
                                    <div class="funding-investors">${round.investors || 'Unknown'}</div>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;
            }
            
            coresignalSection = `
                <div class="coresignal-data">
                    <div class="section-title"><i class="fas fa-info-circle"></i> Company Details</div>
                    <div class="coresignal-overview">
                        <div class="coresignal-item">
                            <div class="item-label">Founded</div>
                            <div class="item-value">${foundedYear}</div>
                        </div>
                        <div class="coresignal-item">
                            <div class="item-label">Company Size</div>
                            <div class="item-value">${companySize}</div>
                        </div>
                        <div class="coresignal-item">
                            <div class="item-label">Industry</div>
                            <div class="item-value">${companyIndustry}</div>
                        </div>
                        <div class="coresignal-item">
                            <div class="item-label">Location</div>
                            <div class="item-value">${companyLocation}</div>
                        </div>
                        <div class="coresignal-item">
                            <div class="item-label">Website</div>
                            <div class="item-value">${website}</div>
                        </div>
                    </div>
                </div>
                ${executivesHtml}
                ${fundingHtml}
            `;
        } else {
            // Basic company info if Coresignal data not available
            coresignalSection = `
                <div class="modal-section">
                    <div class="section-title"><i class="fas fa-info-circle"></i> Company Details</div>
                    <div class="coresignal-overview">
                        <div class="coresignal-item">
                            <div class="item-label">Industry</div>
                            <div class="item-value">${industry}</div>
                        </div>
                        <div class="coresignal-item">
                            <div class="item-label">Location</div>
                            <div class="item-value">${location}</div>
                        </div>
                        <div class="coresignal-item">
                            <div class="item-label">Company Size</div>
                            <div class="item-value">${size}</div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Create the modal content
        modalBody.innerHTML = `
            <div class="modal-close">&times;</div>
            <div class="modal-header-banner"></div>
            <div class="modal-company-logo">
                <img src="${company.logo}" alt="${company.name} logo">
            </div>
            <div class="modal-company-header">
                <h2 class="modal-company-name">${company.name}</h2>
                <div class="modal-company-tagline">${industry}</div>
                <div class="company-stats">
                    <div class="stat-item">
                        <div class="stat-icon"><i class="fas fa-map-marker-alt"></i></div>
                        <div class="stat-text">${location}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon"><i class="fas fa-users"></i></div>
                        <div class="stat-text">${size}</div>
                    </div>
                    <div class="stat-item no-competition">
                        <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                        <div class="stat-text">No competition with existing partners</div>
                    </div>
                </div>
            </div>
            
            <div class="action-buttons">
                <button class="action-button primary-action" id="generate-presentation">
                    <i class="fas fa-file-powerpoint"></i> Generate Presentation
                </button>
                <button class="action-button secondary-action" id="generate-report">
                    <i class="fas fa-file-alt"></i> Generate Research Report
                </button>
                <button class="action-button tertiary-action" id="generate-video">
                    <i class="fas fa-video"></i> Generate Video Presentation
                </button>
            </div>
            
            <div class="modal-section">
                <div class="section-title"><i class="fas fa-building"></i> About</div>
                <div class="modal-company-description">${company.description}</div>
            </div>
            
            ${coresignalSection}
            
            <div class="modal-section partnership-score-section">
                <div class="partnership-score-header">
                    <div class="section-title"><i class="fas fa-handshake"></i> Partnership Potential</div>
                    <div class="partnership-score-value">
                        <div class="score-circle ${scoreClass}">${scaledScore}</div>
                        <div>
                            <div class="score-label">Partnership Score</div>
                            <div class="score-scale">${scaledScore}/10</div>
                        </div>
                    </div>
                </div>
                <div class="modal-fit-content">${formatMarkdown(company.partnership_fit)}</div>
            </div>
        `;
        
        // Add event listeners for the action buttons
        setTimeout(() => {
            // Close button
            document.querySelector('.modal-close').addEventListener('click', () => {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto'; // Enable scrolling
                modal.classList.remove('linkedin-modal'); // Remove LinkedIn class
            });
            
            // Generate presentation button
            document.getElementById('generate-presentation').addEventListener('click', () => {
                alert(`Generating presentation for ${company.name}...`);
                // Here you would add the actual functionality to generate a presentation
            });
            
            // Generate research report button
            document.getElementById('generate-report').addEventListener('click', () => {
                alert(`Generating research report for ${company.name}...`);
                // Here you would add the actual functionality to generate a research report
            });
            
            // Generate video presentation button
            document.getElementById('generate-video').addEventListener('click', () => {
                alert(`Generating video presentation for ${company.name}...`);
                // Here you would add the actual functionality to generate a video presentation
            });
        }, 100);
        
        // Show the modal
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    };
    
    // Close modal
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Enable scrolling
        modal.classList.remove('linkedin-modal'); // Remove LinkedIn class when closing
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Enable scrolling
        }
    });

    // Format markdown to HTML
    const formatMarkdown = (text) => {
        if (!text) return '';
        
        // Basic markdown formatting
        return text
            // Headers
            .replace(/## (.*)/g, '<h2>$1</h2>')
            .replace(/### (.*)/g, '<h3>$1</h3>')
            .replace(/#### (.*)/g, '<h4>$1</h4>')
            
            // Bold and italic
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            
            // Lists
            .replace(/^\s*-\s*(.*)/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
            
            // Line breaks
            .replace(/\n/g, '<br>');
    };

    // Truncate text to a specific length
    const truncateText = (text, maxLength) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    // Handle AI Search
    const handleAiSearch = async () => {
        // Show loader, hide results
        loader.style.display = 'flex';
        resultsContainer.style.display = 'none';
        
        // Create or update the progress container
        let progressContainer = document.getElementById('progress-container');
        if (!progressContainer) {
            progressContainer = document.createElement('div');
            progressContainer.id = 'progress-container';
            progressContainer.classList.add('progress-container');
            loader.appendChild(progressContainer);
        }
        
        progressContainer.innerHTML = `
            <div class="progress-steps">
                <div class="progress-step active" data-step="generating">
                    <div class="step-icon">🧠</div>
                    <div class="step-label">Generating Industry</div>
                </div>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar-fill" style="width: 30%"></div>
            </div>
            <div class="progress-message">AI is generating a relevant industry for partnership analysis...</div>
        `;
        
        try {
            // Fetch AI-generated search query
            const response = await fetch('/ai-search');
            
            if (!response.ok) {
                throw new Error('AI search failed');
            }
            
            const data = await response.json();
            const generatedPrompt = data.prompt;
            
            // Update progress UI
            const progressBarFill = progressContainer.querySelector('.progress-bar-fill');
            const progressMessage = progressContainer.querySelector('.progress-message');
            const progressStep = progressContainer.querySelector('.progress-step');
            
            progressBarFill.style.width = '100%';
            progressStep.classList.remove('active');
            progressStep.classList.add('completed');
            progressMessage.textContent = `Generated industry: "${generatedPrompt}"`;
            
            // Set the search input value and trigger search
            searchInput.value = generatedPrompt;
            
            // Wait a moment before starting the next search
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Start the actual search
            handleSearch();
            
        } catch (error) {
            console.error('Error:', error);
            
            // Update progress UI to show error
            const progressBarFill = progressContainer.querySelector('.progress-bar-fill');
            const progressMessage = progressContainer.querySelector('.progress-message');
            const progressStep = progressContainer.querySelector('.progress-step');
            
            progressBarFill.style.width = '100%';
            progressStep.classList.remove('active');
            progressStep.classList.add('error');
            progressMessage.textContent = `Error: ${error.message}`;
            
            // Hide loader after a moment
            setTimeout(() => {
                loader.style.display = 'none';
            }, 2000);
        }
    };

    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update active tab pane
            tabPanes.forEach(pane => pane.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Event listeners
    searchButton.addEventListener('click', handleSearch);
    aiSearchButton.addEventListener('click', handleAiSearch);
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // Focus search input on load
    searchInput.focus();

    // Create a history tracker in the header
    function createHistoryTracker() {
        const header = document.querySelector('header');
        
        // Create history container
        const historyContainer = document.createElement('div');
        historyContainer.className = 'history-container';
        historyContainer.innerHTML = `
            <div class="history-info">
                <span id="company-count">0</span> companies previously analyzed
                <button id="show-history" class="history-button">Show</button>
                <button id="reset-history" class="history-button reset">Reset</button>
            </div>
            <div id="history-list" class="history-list"></div>
        `;
        
        header.appendChild(historyContainer);
        
        // Add event listeners
        document.getElementById('show-history').addEventListener('click', toggleHistoryList);
        document.getElementById('reset-history').addEventListener('click', resetSearchHistory);
    }
    
    // Toggle history list visibility
    function toggleHistoryList() {
        const historyList = document.getElementById('history-list');
        historyList.classList.toggle('visible');
        
        if (historyList.classList.contains('visible')) {
            document.getElementById('show-history').textContent = 'Hide';
            loadSearchHistory();
        } else {
            document.getElementById('show-history').textContent = 'Show';
        }
    }
    
    // Load search history
    function loadSearchHistory() {
        fetch('/search-history')
            .then(response => response.json())
            .then(data => {
                const companyCount = document.getElementById('company-count');
                const historyList = document.getElementById('history-list');
                
                // Check the structure of the response
                if (data.previously_considered && typeof data.previously_considered === 'object') {
                    // Get companies and count from the new structure
                    const companies = data.previously_considered.companies || [];
                    const count = data.previously_considered.count || 0;
                    
                    // Update the count display
                    companyCount.textContent = count;
                    
                    // Update the list
                    if (companies.length === 0) {
                        historyList.innerHTML = '<p class="empty-history">No companies have been analyzed yet.</p>';
                        return;
                    }
                    
                    // Sort alphabetically
                    const sortedCompanies = [...companies].sort();
                    
                    historyList.innerHTML = sortedCompanies.map(company => 
                        `<div class="history-item">${company}</div>`
                    ).join('');
                    
                    // Also show recent searches if available
                    if (data.search_history && Array.isArray(data.search_history) && data.search_history.length > 0) {
                        historyList.innerHTML += '<h4 class="history-section">Recent Searches</h4>';
                        
                        const recentSearches = data.search_history.slice(0, 5); // Get the 5 most recent searches
                        historyList.innerHTML += recentSearches.map(search => 
                            `<div class="history-search-item">
                                <span class="search-query">${search.query}</span>
                                <span class="search-date">${search.timestamp}</span>
                            </div>`
                        ).join('');
                    }
                } else {
                    // Fallback for old format or unexpected response
                    companyCount.textContent = data.count || 0;
                    
                    if (!data.companies || data.companies.length === 0) {
                        historyList.innerHTML = '<p class="empty-history">No companies have been analyzed yet.</p>';
                        return;
                    }
                    
                    // Sort alphabetically
                    const sortedCompanies = [...data.companies].sort();
                    
                    historyList.innerHTML = sortedCompanies.map(company => 
                        `<div class="history-item">${company}</div>`
                    ).join('');
                }
            })
            .catch(error => {
                console.error('Error loading search history:', error);
                const historyList = document.getElementById('history-list');
                historyList.innerHTML = '<p class="error-history">Error loading history data.</p>';
            });
    }
    
    // Reset search history
    function resetSearchHistory() {
        if (!confirm('Are you sure you want to reset your search history? This will allow previously analyzed companies to be considered again.')) {
            return;
        }
        
        fetch('/reset-history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            const companyCount = document.getElementById('company-count');
            companyCount.textContent = '0';
            
            const historyList = document.getElementById('history-list');
            historyList.innerHTML = '<p class="empty-history">No companies have been analyzed yet.</p>';
            
            // After resetting, refresh the search status
            updateStatusBar(null);
            
            alert('Search history has been reset.');
        })
        .catch(error => {
            console.error('Error resetting search history:', error);
            alert('Failed to reset search history. ' + error.message);
        });
    }

    // Update status bar when search history changes
    function updateStatusBar(data) {
        const statusBar = document.querySelector('.status-bar');
        if (!statusBar) return;
        
        if (!data) {
            statusBar.innerHTML = '<div class="status-item">Ready to search</div>';
            return;
        }
        
        if (data.previously_considered && data.previously_considered.count > 0) {
            const count = data.previously_considered.count;
            statusBar.innerHTML = `<div class="status-item">${count} companies already analyzed</div>`;
        }
    }

    // Function to show a specific tab
    const showTab = (tabId) => {
        // Remove active class from all tab buttons and panes
        tabButtons.forEach(button => button.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));
        
        // Add active class to the selected tab button and pane
        document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('active');
        document.getElementById(tabId).classList.add('active');
    };
});
