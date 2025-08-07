(function () {
    // Kategorileri tanımla
    const categories = ['Free', 'Paid','tekli_tahmin','surpriz_oran','hazirkuponlar'];
    const predictionTypes = ['Match Winner', 'Home/Away', 'Second Half Winner', 'Goals Over/Under', 'Goals Over/Under First Half', 'Goals Over/Under - Second Half',
        'HT/FT Double','Both Teams Score','Win to Nil - Home','Win to Nil - Away','Exact Score','Highest Scoring Half','Correct Score - First Half',
        'Double Chance','First Half Winner','Total - Home','Total - Away','Both Teams Score - First Half','Both Teams To Score - Second Half','Odd/Even',
        'Exact Goals Number','Home Team Exact Goals Number','Away Team Exact Goals Number','Home Team Score a Goal','Away Team Score a Goal',
        'Exact Goals Number - First Half','Home team will score in both halves','Away team will score in both halves','To Score in Both Halves','Winning Margin'
    ]; 
    const predictionValues = {
        'Match Winner': ['Home', 'Draw', 'Away'],
        'Home/Away': ['Home', 'Away'],
        'Second Half Winner': ['Home', 'Draw', 'Away'],
        'Goals Over/Under': ['Over 0.5', 'Under 0.5', 'Over 1.5', 'Under 1.5', 'Over 2.5', 'Under 2.5', 'Over 3.5', 'Under 3.5', 'Over 4.5', 'Under 4.5'],
        'Goals Over/Under First Half': ['Over 0.5', 'Under 0.5', 'Over 1.5', 'Under 1.5'],
        'Goals Over/Under - Second Half': ['Over 0.5', 'Under 0.5', 'Over 1.5', 'Under 1.5'],
       'HT/FT Double': [
            'Home/Home', 'Home/Draw', 'Home/Away',
            'Draw/Home', 'Draw/Draw', 'Draw/Away',
            'Away/Home', 'Away/Draw', 'Away/Away'
        ],
        'Both Teams Score': ['Yes', 'No'],
        'Win to Nil - Home': ['Yes', 'No'],
        'Win to Nil - Away': ['Yes', 'No'],
        'Exact Score': ['1-0', '2-0', '2-1', '3-0', '3-1', '1-1', '0-0', '0-1', '0-2', '1-2'],
        'Highest Scoring Half': ['First Half', 'Second Half', 'Equal'],
        'Correct Score - First Half': ['1-0', '2-0', '1-1', '0-0', '0-1'],
        'Double Chance': ['Home/Draw', 'Home/Away', 'Away/Draw'],
        'First Half Winner': ['Home', 'Draw', 'Away'],
        'Total - Home': ['Over 0.5', 'Under 0.5', 'Over 1.5', 'Under 1.5', 'Over 2.5', 'Under 2.5'],
        'Total - Away': ['Over 0.5', 'Under 0.5', 'Over 1.5', 'Under 1.5', 'Over 2.5', 'Under 2.5'],
        'Both Teams Score - First Half': ['Yes', 'No'],
        'Both Teams To Score - Second Half': ['Yes', 'No'],
        'Odd/Even': ['Odd', 'Even'],
        'Exact Goals Number': ['0', '1', '2', '3', '4', '5', '6+'],
        'Home Team Exact Goals Number': ['0', '1', '2', '3', '4', '5'],
        'Away Team Exact Goals Number': ['0', '1', '2', '3', '4', '5'],
        'Home Team Score a Goal': ['Yes', 'No'],
        'Away Team Score a Goal': ['Yes', 'No'],
        'Exact Goals Number - First Half': ['0', '1', '2', '3', '4'],
        'Home team will score in both halves': ['Yes', 'No'],
        'Away team will score in both halves': ['Yes', 'No'],
        'To Score in Both Halves': ['Home', 'Away', 'Both Teams'],
        'Winning Margin': ['1 Goal', '2 Goals', '3 Goals', '4+ Goals']
    };
    let selectedCategory = 'Free';
    let currentMatches = [];
    let currentDate = '';
    const apiKey = '6f82312979msh155e30f4a1f4880p18cc74jsnfca39f9054d6';
    const apiHost = 'api-football-v1.p.rapidapi.com';

    // Geçici tahmin sepetini tanımla; localStorage'den varsa yükle
    let predictionBasket = [];
    if(localStorage.getItem("predictionBasket")){
      predictionBasket = JSON.parse(localStorage.getItem("predictionBasket"));
    }

    // Sepet güncelleme fonksiyonu
    function updateBasketLocalStorage(){
      localStorage.setItem("predictionBasket", JSON.stringify(predictionBasket));
    }

    // Maçları yükleme fonksiyonu
    window.loadMatches = function () {
        const contentDiv = document.getElementById('content');
        contentDiv.innerHTML = `
            <div id="categoryContainer" class="button-container"></div>
            <div id="searchContainer" class="search-container">
                <input type="text" id="searchInput" placeholder="Maçları ara...">
            </div>
            <div id="dateButtonsContainer" class="button-container"></div>
            <div id="matchContainer"></div>
        `;
        loadCategory('Free');

        // Arama kutusu için event listener
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', () => {
            displayMatches();
        });
    };

    window.loadCategory = function (category) {
        selectedCategory = category;
        const dates = getDateRange();
        displayDateButtons(dates);
        document.getElementById('matchContainer').innerHTML = '';
    };

    function getTurkeyDate() {
        const now = new Date();
        const turkeyOffset = 3 * 60 * 60 * 1000;
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        return new Date(utc + turkeyOffset);
    }

    function getDateRange() {
        const today = getTurkeyDate();
        const dates = [];
        for (let i = -1; i <= 1; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push(date.toISOString().split('T')[0]);
        }
        return dates;
    }

    function displayDateButtons(dates) {
        const dateButtonsContainer = document.getElementById('dateButtonsContainer');
        dateButtonsContainer.innerHTML = '';
        dates.forEach(date => {
            const button = document.createElement('button');
            button.className = 'date-btn';
            button.innerText = date;
            button.addEventListener('click', () => fetchMatches(date));
            dateButtonsContainer.appendChild(button);
        });
    }

    function fetchMatches(date) {
        currentDate = date;
        const url = `https://${apiHost}/v3/fixtures?date=${date}`;
        const options = {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': apiHost
            }
        };

        fetch(url, options)
            .then(response => response.json())
            .then(data => {
                if (data.errors && Object.keys(data.errors).length > 0) {
                    console.error('API Hatası:', data.errors);
                    alert('API isteği sırasında bir hata oluştu: ' + JSON.stringify(data.errors));
                    return;
                }
                if (data.message) {
                    console.error('API Mesajı:', data.message);
                    alert('API isteği sırasında bir hata oluştu: ' + data.message);
                    return;
                }
                if (!data.response) {
                    console.error('API Yanıtı Beklenmedik Biçimde:', data);
                    alert('API yanıtı beklenmedik bir biçimde geldi.');
                    return;
                }
                console.log("Fixture Yanıtı: ", data);
                currentMatches = data.response;
                displayMatches();
            })
            .catch(error => {
                console.error('Hata:', error);
                alert('Bir hata oluştu: ' + error.message);
            });
    }

    function displayMatches() {
        const matchContainer = document.getElementById('matchContainer');
        matchContainer.innerHTML = '';
        if (!currentMatches || currentMatches.length === 0) {
            matchContainer.innerHTML = '<p>Maç bulunamadı.</p>';
            return;
        }
        const searchInput = document.getElementById('searchInput');
        const searchQuery = searchInput.value.toLowerCase();
        const filteredMatches = currentMatches.filter(matchData => {
            const homeTeam = matchData.teams.home.name.toLowerCase();
            const awayTeam = matchData.teams.away.name.toLowerCase();
            return homeTeam.includes(searchQuery) || awayTeam.includes(searchQuery);
        });
        if (filteredMatches.length === 0) {
            matchContainer.innerHTML = '<p>Maç bulunamadı.</p>';
            return;
        }
        const table = document.createElement('table');
        table.className = 'matches-table';
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const headers = ['Tarih', 'Lig', 'Ev Sahibi', 'Konuk', 'İlk Yarı', 'Maç Sonu', 'Tahmin Yap'];
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        const tbody = document.createElement('tbody');

        filteredMatches.forEach(matchData => {
            const fixture = matchData.fixture;
            const teams = matchData.teams;
            const league = matchData.league;
            const score = matchData.score;
            const row = document.createElement('tr');

            const dateCell = document.createElement('td');
            dateCell.textContent = new Date(fixture.date).toLocaleString();
            row.appendChild(dateCell);

            const leagueCell = document.createElement('td');
            leagueCell.textContent = league.name;
            row.appendChild(leagueCell);

            const homeTeamCell = document.createElement('td');
            const homeLogo = document.createElement('img');
            homeLogo.src = teams.home.logo;
            homeLogo.alt = teams.home.name + ' Logo';
            homeLogo.className = 'team-logo';
            homeTeamCell.appendChild(homeLogo);
            const homeTeamName = document.createElement('span');
            homeTeamName.textContent = teams.home.name;
            homeTeamCell.appendChild(homeTeamName);
            row.appendChild(homeTeamCell);
    
            const awayTeamCell = document.createElement('td');
            const awayLogo = document.createElement('img');
            awayLogo.src = teams.away.logo;
            awayLogo.alt = teams.away.name + ' Logo';
            awayLogo.className = 'team-logo';
            awayTeamCell.appendChild(awayLogo);
            const awayTeamName = document.createElement('span');
            awayTeamName.textContent = teams.away.name;
            awayTeamCell.appendChild(awayTeamName);
            row.appendChild(awayTeamCell);

            const firstHalfCell = document.createElement('td');
            if (score.halftime && score.halftime.home !== null && score.halftime.away !== null) {
                firstHalfCell.textContent = `${score.halftime.home} - ${score.halftime.away}`;
            } else {
                firstHalfCell.textContent = '-';
            }
            row.appendChild(firstHalfCell);

            const fullTimeCell = document.createElement('td');
            if (score.fulltime && score.fulltime.home !== null && score.fulltime.away !== null) {
                fullTimeCell.textContent = `${score.fulltime.home} - ${score.fulltime.away}`;
            } else {
                fullTimeCell.textContent = '-';
            }
            row.appendChild(fullTimeCell);

            const actionCell = document.createElement('td');
            const toggleFormBtn = document.createElement('button');
            toggleFormBtn.className = 'toggleFormBtn';
            toggleFormBtn.textContent = 'TE';
            const manualFormBtn = document.createElement('button');
            manualFormBtn.className = 'manualFormBtn';
            manualFormBtn.textContent = 'MTE';
            let predictionForm = null;
            let manualForm = null;

            toggleFormBtn.addEventListener('click', () => {
                const openForms = tbody.querySelectorAll('.prediction-form');
                openForms.forEach(form => {
                    if (form !== predictionForm) {
                        form.style.display = 'none';
                    }
                });
                if (!predictionForm) {
                    predictionForm = createPredictionForm(fixture.id, fixture.date, teams, league);
                    const formRow = document.createElement('tr');
                    const formCell = document.createElement('td');
                    formCell.colSpan = 7;
                    formCell.appendChild(predictionForm);
                    formRow.appendChild(formCell);
                    tbody.insertBefore(formRow, row.nextSibling);
                } else {
                    predictionForm.style.display = predictionForm.style.display === 'none' ? 'block' : 'none';
                }
            });

            manualFormBtn.addEventListener('click', () => {
                const openManualForms = tbody.querySelectorAll('.manual-prediction-form');
                openManualForms.forEach(form => {
                    if (form !== manualForm) {
                        form.style.display = 'none';
                    }
                });
                if (!manualForm) {
                    manualForm = createManualPredictionForm(fixture.id, fixture.date, teams, league);
                    const formRow = document.createElement('tr');
                    const formCell = document.createElement('td');
                    formCell.colSpan = 7;
                    formCell.appendChild(manualForm);
                    formRow.appendChild(formCell);
                    tbody.insertBefore(formRow, row.nextSibling);
                } else {
                    manualForm.style.display = manualForm.style.display === 'none' ? 'block' : 'none';
                }
            });

            actionCell.appendChild(toggleFormBtn);
            actionCell.appendChild(manualFormBtn);
            row.appendChild(actionCell);
            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        matchContainer.appendChild(table);
    }

    // Manuel tahmin formunu oluşturma fonksiyonu (Kaydet ve yanına Sepete Ekle butonları eklenmiştir)
    function createManualPredictionForm(fixtureId, fixtureDate, teams, league) {
        const manualForm = document.createElement('div');
        manualForm.className = 'manual-prediction-form';
        const categoryLabel = document.createElement('h4');
        categoryLabel.textContent = 'Kategori:';
        const categorySelect = document.createElement('select');
        categorySelect.className = 'categorySelect';
        categorySelect.innerHTML = `<option value="">Kategori Seçin</option>
            ${categories.map(category => `<option value="${category}">${category}</option>`).join('')}`;
    
        const predictionTypeLabel = document.createElement('h4');
        predictionTypeLabel.textContent = 'Tahmin Türü:';
        const predictionTypeSelect = document.createElement('select');
        predictionTypeSelect.className = 'predictionTypeSelect';
        predictionTypeSelect.innerHTML = `<option value="">Tahmin Türü Seçin</option>
            ${predictionTypes.map(type => `<option value="${type}">${type}</option>`).join('')}`;
    
        const predictionValueLabel = document.createElement('h4');
        predictionValueLabel.textContent = 'Tahmin Değeri:';
        const predictionValueSelect = document.createElement('select');
        predictionValueSelect.className = 'predictionValueSelect';
        predictionValueSelect.innerHTML = '<option value="">Önce Tahmin Türünü Seçin</option>';
        predictionValueSelect.disabled = true;
    
        const oddsLabel = document.createElement('h4');
        oddsLabel.textContent = 'Oran:';
        const oddsInput = document.createElement('input');
        oddsInput.type = 'number';
        oddsInput.step = '0.01';
        oddsInput.placeholder = 'Oran girin';
    
        const coinAmountLabel = document.createElement('h4');
        coinAmountLabel.textContent = 'Coin Miktarı:';
        const coinAmountInput = document.createElement('input');
        coinAmountInput.type = 'number';
        coinAmountInput.step = '0.01';
        coinAmountInput.placeholder = 'Coin miktarı girin';
    
        // Orijinal Kaydet butonu
        const saveBtn = document.createElement('button');
        saveBtn.className = 'saveManualBtn';
        saveBtn.textContent = 'Kaydet';
    
        // Yeni: Sepete Ekle butonu
        const addToBasketBtn = document.createElement('button');
        addToBasketBtn.className = 'addToBasketBtn';
        addToBasketBtn.textContent = 'Sepete Ekle';
    
        manualForm.appendChild(categoryLabel);
        manualForm.appendChild(categorySelect);
        manualForm.appendChild(predictionTypeLabel);
        manualForm.appendChild(predictionTypeSelect);
        manualForm.appendChild(predictionValueLabel);
        manualForm.appendChild(predictionValueSelect);
        manualForm.appendChild(oddsLabel);
        manualForm.appendChild(oddsInput);
        manualForm.appendChild(coinAmountLabel);
        manualForm.appendChild(coinAmountInput);
        manualForm.appendChild(saveBtn);
        manualForm.appendChild(addToBasketBtn);
    
        predictionTypeSelect.addEventListener('change', () => {
            const selectedType = predictionTypeSelect.value;
            if (selectedType && predictionValues[selectedType]) {
                predictionValueSelect.innerHTML = `<option value="">Tahmin Değeri Seçin</option>
                    ${predictionValues[selectedType].map(value => `<option value="${value}">${value}</option>`).join('')}`;
                predictionValueSelect.disabled = false;
            } else {
                predictionValueSelect.innerHTML = '<option value="">Tahmin Türü Seçin</option>';
                predictionValueSelect.disabled = true;
            }
        });

        // Kaydet butonu: Mevcut kod mantığı ile veritabanına kaydetme işlemi
        saveBtn.addEventListener('click', () => {
            const selectedCategory = categorySelect.value;
            const predictionType = predictionTypeSelect.value;
            const predictionValue = predictionValueSelect.value;
            const odds = oddsInput.value;
            let coinAmount = coinAmountInput.value;
    
            if (!selectedCategory || !predictionType || !predictionValue || !odds) {
                alert('Lütfen tüm alanları doldurun.');
                return;
            }
    
            if (selectedCategory === 'Paid' && !coinAmount) {
                alert('Paid kategorisi için coin miktarı girmek zorunludur.');
                return;
            }
    
            if (!coinAmount) {
                coinAmount = 0;
            }
    
            const manualPredictionData = {
                matchId: fixtureId,
                homeTeam: teams.home.name,
                awayTeam: teams.away.name,
                homeLogo: teams.home.logo,
                awayLogo: teams.away.logo,
                date: fixtureDate,
                league: league.name,
                category: selectedCategory,
                predictionType: predictionType,
                predictionValue: predictionValue,
                odds: parseFloat(odds),
                coinAmount: parseFloat(coinAmount),
                status: 'manual'
            };
    
            const dateKey = currentDate;
            const newMatchKey = firebase.database().ref().child('predictions').push().key;
    
            const updates = {};
            updates[`/predictions/${dateKey}/${selectedCategory}/${newMatchKey}`] = manualPredictionData;
    
            firebase.database().ref().update(updates)
                .then(() => {
                    alert('Manuel tahmin kaydedildi.');
                    manualForm.style.display = 'none';
                })
                .catch(error => {
                    console.error('Manuel tahmin kaydedilirken hata oluştu:', error);
                    alert('Manuel tahmin kaydedilirken bir hata oluştu.');
                });
        });
    
        // Sepete Ekle butonu: Tahmini sepet dizisine ekler ve localStorage güncellenir
        addToBasketBtn.addEventListener('click', () => {
            const selectedCategory = categorySelect.value;
            const predictionType = predictionTypeSelect.value;
            const predictionValue = predictionValueSelect.value;
            const odds = oddsInput.value;
            let coinAmount = coinAmountInput.value;
    
            if (!selectedCategory || !predictionType || !predictionValue || !odds) {
                alert('Lütfen tüm alanları doldurun.');
                return;
            }
    
            if (selectedCategory === 'Paid' && !coinAmount) {
                alert('Paid kategorisi için coin miktarı girmek zorunludur.');
                return;
            }
    
            if (!coinAmount) {
                coinAmount = 0;
            }
    
            const manualPredictionData = {
                matchId: fixtureId,
                homeTeam: teams.home.name,
                awayTeam: teams.away.name,
                homeLogo: teams.home.logo,
                awayLogo: teams.away.logo,
                date: fixtureDate,
                league: league.name,
                category: selectedCategory,
                predictionType: predictionType,
                predictionValue: predictionValue,
                odds: parseFloat(odds),
                coinAmount: parseFloat(coinAmount),
                status: 'manual'
            };
    
            predictionBasket.push(manualPredictionData);
            updateBasketLocalStorage();
            alert('Manuel tahmin sepete eklendi.');
        });
    
        return manualForm;
    }

    // Normal tahmin formunu oluşturma fonksiyonu (Kaydet ve yanına Sepete Ekle butonları eklenmiştir)
    function createPredictionForm(fixtureId, fixtureDate, teams, league) {
        const predictionForm = document.createElement('div');
        predictionForm.className = 'prediction-form';
    
        const categoryLabel = document.createElement('h4');
        categoryLabel.textContent = 'Kategori:';
        const categorySelect = document.createElement('select');
        categorySelect.className = 'categorySelect';
        categorySelect.innerHTML = `<option value="">Kategori Seçin</option>
            ${categories.map(category => `<option value="${category}">${category}</option>`).join('')}`;
    
        const predictionTypeLabel = document.createElement('h4');
        predictionTypeLabel.textContent = 'Tahmin Türü:';
        const predictionTypeSelect = document.createElement('select');
        predictionTypeSelect.className = 'predictionType';
        predictionTypeSelect.innerHTML = '<option value="">Yükleniyor...</option>';
        predictionTypeSelect.disabled = true;
    
        const predictionValueLabel = document.createElement('h4');
        predictionValueLabel.textContent = 'Tahmin:';
        const predictionValueSelect = document.createElement('select');
        predictionValueSelect.className = 'predictionValueSelect';
        predictionValueSelect.innerHTML = '<option value="">Tahmin Türü Seçin</option>';
        predictionValueSelect.disabled = true;
    
        const oddsLabel = document.createElement('h4');
        oddsLabel.textContent = 'Oran:';
        const oddsInput = document.createElement('input');
        oddsInput.type = 'number';
        oddsInput.className = 'odds';
        oddsInput.placeholder = 'Oran';
        oddsInput.step = '0.01';
    
        const coinAmountLabel = document.createElement('h4');
        coinAmountLabel.textContent = 'Coin Miktarı:';
        const coinAmountInput = document.createElement('input');
        coinAmountInput.type = 'number';
        coinAmountInput.className = 'coinAmount';
        coinAmountInput.placeholder = 'Coin miktarı girin';
        coinAmountInput.step = '0.01';
    
        // Orijinal Kaydet butonu
        const saveBtn = document.createElement('button');
        saveBtn.className = 'saveBtn';
        saveBtn.textContent = 'Kaydet';
        saveBtn.disabled = true;
    
        // Yeni: Sepete Ekle butonu
        const addToBasketBtn = document.createElement('button');
        addToBasketBtn.className = 'addToBasketBtn';
        addToBasketBtn.textContent = 'Sepete Ekle';
    
        predictionForm.appendChild(categoryLabel);
        predictionForm.appendChild(categorySelect);
        predictionForm.appendChild(predictionTypeLabel);
        predictionForm.appendChild(predictionTypeSelect);
        predictionForm.appendChild(predictionValueLabel);
        predictionForm.appendChild(predictionValueSelect);
        predictionForm.appendChild(oddsLabel);
        predictionForm.appendChild(oddsInput);
        predictionForm.appendChild(coinAmountLabel);
        predictionForm.appendChild(coinAmountInput);
        predictionForm.appendChild(saveBtn);
        predictionForm.appendChild(addToBasketBtn);
    
        fetchPredictionTypes(fixtureId, predictionTypeSelect, predictionValueSelect, oddsInput, saveBtn);
    
        predictionTypeSelect.addEventListener('change', () => {
            const selectedType = predictionTypeSelect.value;
            const bets = predictionTypeSelect.bets || [];
            const selectedBet = bets.find(bet => bet.name === selectedType);
            predictionValueSelect.innerHTML = '<option value="">Tahmin Seçin</option>';
            oddsInput.value = '';
            predictionValueSelect.disabled = false;
            if (selectedBet && selectedBet.values) {
                selectedBet.values.forEach(value => {
                    const option = document.createElement('option');
                    option.value = value.value;
                    option.text = `${value.value} (Oran: ${value.odd})`;
                    predictionValueSelect.appendChild(option);
                });
            } else {
                predictionValueSelect.disabled = true;
            }
        });
    
        predictionValueSelect.addEventListener('change', () => {
            const selectedType = predictionTypeSelect.value;
            const selectedValue = predictionValueSelect.value;
            const bets = predictionTypeSelect.bets || [];
            const selectedBet = bets.find(bet => bet.name === selectedType);
            if (selectedBet && selectedBet.values) {
                const selectedPrediction = selectedBet.values.find(value => value.value === selectedValue);
                oddsInput.value = selectedPrediction ? selectedPrediction.odd : '';
            } else {
                oddsInput.value = '';
            }
        });
    
        // Kaydet butonu: Mevcut kod mantığıyla veritabanına kaydetme
        saveBtn.addEventListener('click', () => {
            const selectedCategory = categorySelect.value;
            const predictionType = predictionTypeSelect.value;
            const predictionValue = predictionValueSelect.value;
            const odds = oddsInput.value;
            let coinAmount = coinAmountInput.value;
            if (!selectedCategory || !predictionType || !predictionValue || !odds) {
                alert('Lütfen tüm alanları doldurun.');
                return;
            }
            if (selectedCategory === 'Paid' && !coinAmount) {
                alert('Paid kategorisi için coin miktarı girmek zorunludur.');
                return;
            }
            if (!coinAmount) {
                coinAmount = 0;
            }
            const matchDataToSave = {
                matchId: fixtureId,
                homeTeam: teams.home.name,
                awayTeam: teams.away.name,
                homeLogo: teams.home.logo,
                awayLogo: teams.away.logo,
                date: fixtureDate,
                league: league.name,
                category: selectedCategory,
                predictionType: predictionType,
                predictionValue: predictionValue,
                odds: parseFloat(odds),
                coinAmount: parseFloat(coinAmount),
                status: 'ongoing'
            };
            const dateKey = currentDate;
            const newMatchKey = firebase.database().ref().child('predictions').push().key;
            const updates = {};
            updates[`/predictions/${dateKey}/${selectedCategory}/${newMatchKey}`] = matchDataToSave;
            firebase.database().ref().update(updates)
                .then(() => {
                    alert('Maç tahmini kaydedildi.');
                    predictionForm.style.display = 'none';
                })
                .catch(error => {
                    console.error('Maç kaydedilirken hata oluştu:', error);
                    alert('Maç kaydedilirken bir hata oluştu.');
                });
        });
    
        // Sepete Ekle butonu: Tahmini sepet dizisine ekler ve localStorage güncellenir
        addToBasketBtn.addEventListener('click', () => {
            const selectedCategory = categorySelect.value;
            const predictionType = predictionTypeSelect.value;
            const predictionValue = predictionValueSelect.value;
            const odds = oddsInput.value;
            let coinAmount = coinAmountInput.value;
            if (!selectedCategory || !predictionType || !predictionValue || !odds) {
                alert('Lütfen tüm alanları doldurun.');
                return;
            }
            if (selectedCategory === 'Paid' && !coinAmount) {
                alert('Paid kategorisi için coin miktarı girmek zorunludur.');
                return;
            }
            if (!coinAmount) {
                coinAmount = 0;
            }
            const matchDataToSave = {
                matchId: fixtureId,
                homeTeam: teams.home.name,
                awayTeam: teams.away.name,
                homeLogo: teams.home.logo,
                awayLogo: teams.away.logo,
                date: fixtureDate,
                league: league.name,
                category: selectedCategory,
                predictionType: predictionType,
                predictionValue: predictionValue,
                odds: parseFloat(odds),
                coinAmount: parseFloat(coinAmount),
                status: 'ongoing'
            };
            predictionBasket.push(matchDataToSave);
            updateBasketLocalStorage();
            alert('Maç tahmini sepete eklendi.');
            predictionForm.style.display = 'none';
        });
    
        return predictionForm;
    }
    
    function fetchPredictionTypes(fixtureId, predictionTypeSelect, predictionValueSelect, oddsInput, saveBtn) {
        const url = `https://${apiHost}/v3/odds?fixture=${fixtureId}`;
        const options = {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': apiHost
            }
        };
    
        fetch(url, options)
            .then(response => response.json())
            .then(data => {
                if (data.errors && Object.keys(data.errors).length > 0) {
                    console.error('API Hatası:', data.errors);
                    alert('API isteği sırasında bir hata oluştu: ' + JSON.stringify(data.errors));
                    predictionTypeSelect.innerHTML = '<option value="">Tahmin Türü Bulunamadı</option>';
                    predictionTypeSelect.disabled = true;
                    saveBtn.disabled = true;
                    return;
                }
                if (!data.response || data.response.length === 0) {
                    console.warn('Bu maç için oran türü bulunamadı.');
                    updatePredictionTypes([], predictionTypeSelect, predictionValueSelect, oddsInput);
                    predictionTypeSelect.innerHTML = '<option value="">Tahmin Türü Bulunamadı</option>';
                    predictionTypeSelect.disabled = true;
                    saveBtn.disabled = true;
                    return;
                }
                let validBookmaker = null;
                for (const bookmaker of data.response[0].bookmakers) {
                    if (bookmaker.bets && bookmaker.bets.length > 0) {
                        validBookmaker = bookmaker;
                        break;
                    }
                }
                if (validBookmaker) {
                    console.log('Geçerli Bookmaker:', validBookmaker);
                    updatePredictionTypes(validBookmaker.bets, predictionTypeSelect, predictionValueSelect, oddsInput);
                    predictionTypeSelect.disabled = false;
                    saveBtn.disabled = false;
                } else {
                    console.warn('Bu maç için geçerli oranlar bulunamadı.');
                    predictionTypeSelect.innerHTML = '<option value="">Tahmin Türü Bulunamadı</option>';
                    predictionTypeSelect.disabled = true;
                    saveBtn.disabled = true;
                }
            })
            .catch(error => {
                console.error('Tahmin türleri yüklenirken hata oluştu:', error);
                alert('Tahmin türleri yüklenirken bir hata oluştu.');
                predictionTypeSelect.innerHTML = '<option value="">Tahmin Türü Bulunamadı</option>';
                predictionTypeSelect.disabled = true;
                saveBtn.disabled = true;
            });
    }
    
    function updatePredictionTypes(bets, predictionTypeSelect, predictionValueSelect, oddsInput) {
        predictionTypeSelect.innerHTML = '<option value="">Tahmin Türü Seçin</option>';
        predictionValueSelect.innerHTML = '<option value="">Tahmin Seçin</option>';
        oddsInput.value = '';
    
        if (!bets || bets.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.text = 'Tahmin Türü Bulunamadı';
            predictionTypeSelect.appendChild(option);
            predictionTypeSelect.disabled = true;
        } else {
            bets.forEach(bet => {
                const option = document.createElement('option');
                option.value = bet.name;
                option.text = bet.name;
                predictionTypeSelect.appendChild(option);
            });
            predictionTypeSelect.disabled = false;
        }
    
        predictionTypeSelect.bets = bets;
    }
    
    // Yeni: Sepeti görüntüleme fonksiyonu (Menüden çağrılacak)
    window.showBasket = function() {
        const contentDiv = document.getElementById('content');
        contentDiv.innerHTML = '<h2>Sepet</h2>';
        if (predictionBasket.length === 0) {
            contentDiv.innerHTML += '<p>Sepet boş.</p>';
            return;
        }
        let html = '<table class="basket-table"><thead><tr><th>Tarih</th><th>Maç</th><th>Tahmin Türü</th><th>Tahmin</th><th>Oran</th><th>Coin</th><th>İşlem</th></tr></thead><tbody>';
        predictionBasket.forEach((item, index) => {
            html += `<tr>
                <td>${new Date(item.date).toLocaleString()}</td>
                <td>${item.homeTeam} vs ${item.awayTeam}</td>
                <td>${item.predictionType}</td>
                <td>${item.predictionValue}</td>
                <td>${item.odds}</td>
                <td>${item.coinAmount}</td>
                <td><button onclick="removeFromBasket(${index})">Sil</button></td>
            </tr>`;
        });
        html += '</tbody></table>';
        html += '<button onclick="publishBasket()">Yayınla</button>';
        contentDiv.innerHTML += html;
    };
    
    // Sepetten tahmin silme fonksiyonu
    window.removeFromBasket = function(index) {
        predictionBasket.splice(index, 1);
        updateBasketLocalStorage();
        showBasket();
    };
    
    // Sepetteki tahminleri veritabanına topluca kaydetme fonksiyonu (Her tahmin için ayrı update yapıp ilerleme çubuğunu güncelliyoruz)
    window.publishBasket = function() {
        if (predictionBasket.length === 0) {
            alert('Sepet boş.');
            return;
        }
        const contentDiv = document.getElementById('content');
        // İlerleme çubuğu için kapsayıcı oluştur
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';
        const progressLabel = document.createElement('p');
        progressLabel.textContent = 'Yayınlama İşlemi:';
        const progressBar = document.createElement('progress');
        progressBar.id = 'publishProgressBar';
        progressBar.max = predictionBasket.length;
        progressBar.value = 0;
        progressContainer.appendChild(progressLabel);
        progressContainer.appendChild(progressBar);
        contentDiv.insertBefore(progressContainer, contentDiv.firstChild);
    
        let completed = 0;
        let publishPromises = [];
    
        predictionBasket.forEach(item => {
            const dateKey = currentDate;
            const newMatchKey = firebase.database().ref().child('predictions').push().key;
            let update = {};
            update[`/predictions/${dateKey}/${item.category}/${newMatchKey}`] = item;
            let p = firebase.database().ref().update(update)
                .then(() => {
                    completed++;
                    progressBar.value = completed;
                });
            publishPromises.push(p);
        });
    
        Promise.all(publishPromises).then(() => {
            alert('Tahminler yayınlandı.');
            predictionBasket = [];
            updateBasketLocalStorage();
            progressContainer.remove();
            showBasket();
        }).catch(error => {
            console.error('Tahminler yayınlanırken hata oluştu:', error);
            alert('Tahminler yayınlanırken hata oluştu.');
            progressContainer.remove();
        });
    };
    
    // Bildirim gönderme fonksiyonu (Değişiklik yok)
    function sendNotificationToAllUsers(messageContent) {
        const usersRef = firebase.database().ref('/users');
        usersRef.once('value')
            .then(snapshot => {
                const users = snapshot.val();
                if (users) {
                    const updates = {};
                    const timestamp = new Date().toISOString();
                    Object.keys(users).forEach(userId => {
                        const newNotificationKey = firebase.database().ref().child('users').child(userId).child('notifications').push().key;
                        const notificationData = {
                            title: "Maç Bildirimi",
                            body: messageContent,
                            isDisplayed: true,
                            isRead: false,
                            timestamp: timestamp
                        };
                        updates[`/users/${userId}/notifications/${newNotificationKey}`] = notificationData;
                    });
                    return firebase.database().ref().update(updates);
                } else {
                    console.warn('Kullanıcı bulunamadı.');
                }
            })
            .then(() => {
                console.log('Tüm kullanıcılara bildirim gönderildi.');
            })
            .catch(error => {
                console.error('Bildirim gönderilirken hata oluştu:', error);
            });
    }
})();
