(function() {
  var mount = document.getElementById('pokewallet-db');
  if (!mount) return;

  var BASE = 'https://pokewallet-price-database.jhc5829.workers.dev';
  var PAGE_SIZE = 24;

  var allCards = [], filtered = [], currentPage = 1;
  var loadToken = 0;
  var renderedPage = null, renderedCount = 0;

  var style = document.createElement('style');
  style.textContent = '#pokewallet-db{font-family:sans-serif;background:#ffffff;padding:24px;border-radius:12px;max-width:1200px;margin:0 auto}#pkw-title{text-align:center;margin-bottom:20px;color:#333;font-size:24px}.pkw-filters{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px;justify-content:center;align-items:center}.pkw-filters select,.pkw-filters input{padding:8px 12px;border-radius:6px;border:1px solid #ccc;font-size:14px;background:#fff;color:#333}.pkw-filters input{width:220px}#pkw-status{text-align:center;color:#888;margin:24px 0 8px;font-size:14px}#pkw-progress-track{width:100%;height:4px;background:#eee;border-radius:2px;overflow:hidden;margin:0 0 16px;display:none}#pkw-progress-fill{height:100%;width:0%;background:#1a73e8;transition:width 0.2s ease}#pkw-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:16px}.pkw-card{background:#fff;border-radius:10px;padding:12px;box-shadow:0 2px 8px rgba(0,0,0,.08);text-align:center;transition:transform 0.15s ease;cursor:pointer}.pkw-card:hover{transform:translateY(-2px)}.pkw-card img{width:100%;border-radius:6px;margin-bottom:8px;background:#f0f0f0;min-height:120px}.pkw-card h3{font-size:13px;color:#333;margin-bottom:4px}.pkw-set{font-size:11px;color:#888;margin-bottom:6px}.pkw-price{font-size:15px;font-weight:bold;color:#2e7d32}.pkw-price .pkw-source{font-weight:normal;font-size:10px;color:#999}.pkw-price.na{color:#aaa;font-weight:normal;font-size:12px}#pkw-pagination{display:flex;justify-content:center;gap:8px;margin-top:24px;flex-wrap:wrap}#pkw-pagination button{padding:6px 14px;border-radius:6px;border:1px solid #ccc;background:#fff;cursor:pointer;font-size:13px}#pkw-pagination button.active{background:#1a73e8;color:#fff;border-color:#1a73e8}#pkw-pagination button:disabled{opacity:.4;cursor:default}#pkw-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);display:none;align-items:center;justify-content:center;z-index:10000;padding:20px}#pkw-modal-overlay.open{display:flex}#pkw-modal{background:#fff;border-radius:12px;max-width:520px;width:100%;display:flex;gap:20px;padding:24px;position:relative;box-shadow:0 8px 32px rgba(0,0,0,.3)}#pkw-modal-close{position:absolute;top:10px;right:14px;background:none;border:none;font-size:22px;line-height:1;cursor:pointer;color:#888}#pkw-modal-close:hover{color:#333}#pkw-modal-img{flex:0 0 45%;max-width:45%}#pkw-modal-img img{width:100%;border-radius:8px;background:#f0f0f0;display:block}#pkw-modal-info{flex:1;min-width:0;display:flex;flex-direction:column;gap:10px;justify-content:center}#pkw-modal-info h2{font-size:18px;color:#333;margin:0}#pkw-modal-row{display:flex;flex-direction:column;gap:6px;font-size:14px;color:#555}#pkw-modal-row div strong{color:#333}#pkw-modal-price{font-size:20px;font-weight:bold;color:#2e7d32;margin-top:4px}#pkw-modal-price .pkw-source{font-weight:normal;font-size:12px;color:#999}@media (max-width:480px){#pkw-modal{flex-direction:column}#pkw-modal-img{max-width:100%}}';
  document.head.appendChild(style);

  mount.innerHTML = '<h1 id="pkw-title">Pokémon Price Database</h1><div class="pkw-filters"><select id="pkw-setFilter"><option value="">All Sets</option></select><input type="text" id="pkw-search" placeholder="Search card name..." /><select id="pkw-market"><option value="tcgplayer">US (TCGPlayer)</option><option value="cardmarket">EU (Cardmarket)</option></select><select id="pkw-sort"><option value="">Sort by Price</option><option value="high">Price: High to Low</option><option value="low">Price: Low to High</option></select></div><div id="pkw-status">Loading sets...</div><div id="pkw-progress-track"><div id="pkw-progress-fill"></div></div><div id="pkw-grid"></div><div id="pkw-pagination"></div><div id="pkw-modal-overlay"><div id="pkw-modal"><button id="pkw-modal-close" aria-label="Close">×</button><div id="pkw-modal-img"><img id="pkw-modal-img-el" alt="" /></div><div id="pkw-modal-info"><h2 id="pkw-modal-name"></h2><div id="pkw-modal-row"><div><strong>Set:</strong> <span id="pkw-modal-set"></span></div><div><strong>Card #:</strong> <span id="pkw-modal-number"></span></div><div><strong>Rarity:</strong> <span id="pkw-modal-rarity"></span></div></div><div id="pkw-modal-price"></div></div></div></div>';

  function openModal(card) {
    var info = card.card_info;
    var price = getPrice(card);
    document.getElementById('pkw-modal-img-el').src = BASE + '/image?id=' + encodeURIComponent(card.id);
    document.getElementById('pkw-modal-img-el').onerror = function() {
      this.onerror = null;
      this.src = BASE + '/card-back.png';
    };
    document.getElementById('pkw-modal-img-el').alt = info.clean_name || info.name;
    document.getElementById('pkw-modal-name').textContent = info.clean_name || info.name;
    document.getElementById('pkw-modal-set').textContent = info.set_name || 'Unknown';
    document.getElementById('pkw-modal-number').textContent = info.card_number || 'Unknown';
    document.getElementById('pkw-modal-rarity').textContent = info.rarity || 'Unknown';
    var priceEl = document.getElementById('pkw-modal-price');
    priceEl.innerHTML = '';
    if (price) {
      priceEl.appendChild(document.createTextNode('$' + price.value.toFixed(2) + ' '));
      var source = document.createElement('span');
      source.className = 'pkw-source';
      source.textContent = price.source;
      priceEl.appendChild(source);
    } else {
      priceEl.textContent = 'No price data';
    }
    document.getElementById('pkw-modal-overlay').className = 'open';
  }

  function closeModal() {
    document.getElementById('pkw-modal-overlay').className = '';
  }

  document.getElementById('pkw-modal-overlay').addEventListener('click', function(e) {
    if (e.target.id === 'pkw-modal-overlay') closeModal();
  });
  document.getElementById('pkw-modal-close').addEventListener('click', closeModal);
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeModal();
  });

  var MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

  function parseReleaseDate(str) {
    if (!str) return 0;
    var m = str.match(/(\d+)\w*\s+([A-Za-z]+),?\s+(\d{4})/);
    if (!m) return 0;
    var day = parseInt(m[1], 10);
    var month = MONTHS[m[2].slice(0, 3).toLowerCase()];
    var year = parseInt(m[3], 10);
    if (month === undefined || isNaN(day) || isNaN(year)) return 0;
    return new Date(year, month, day).getTime();
  }

  var SETS_CACHE_KEY = 'pkwapp_sets_v1';
  var SETS_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days - sets rarely change

  function loadSetsCache() {
    try {
      var raw = localStorage.getItem(SETS_CACHE_KEY);
      if (!raw) return null;
      var p = JSON.parse(raw);
      if (Date.now() - p.t > SETS_CACHE_TTL) { localStorage.removeItem(SETS_CACHE_KEY); return null; }
      return p.d;
    } catch (e) { return null; }
  }

  function saveSetsCache(sets) {
    try { localStorage.setItem(SETS_CACHE_KEY, JSON.stringify({ t: Date.now(), d: sets })); } catch (e) {}
  }

  function setStatus(msg) { var el = document.getElementById('pkw-status'); if (el) el.textContent = msg; }
  function showProgress(pct) {
    var track = document.getElementById('pkw-progress-track');
    var fill = document.getElementById('pkw-progress-fill');
    if (track) track.style.display = 'block';
    if (fill) fill.style.width = Math.max(0, Math.min(100, pct)) + '%';
  }
  function hideProgress() {
    var track = document.getElementById('pkw-progress-track');
    if (track) track.style.display = 'none';
  }

  function populateSets(sets) {
    var sel = document.getElementById('pkw-setFilter');
    if (!sel) return;
    sets.slice()
      .sort(function(a, b) { return parseReleaseDate(b.release_date) - parseReleaseDate(a.release_date); })
      .forEach(function(s) {
        var opt = document.createElement('option');
        opt.value = s.set_code;
        opt.textContent = s.name;
        sel.appendChild(opt);
      });
    setStatus('Select a set to load cards, or search by name.');
  }

  function loadSets() {
    var cached = loadSetsCache();
    if (cached) { populateSets(cached); return; }
    setStatus('Loading sets...');
    fetch(BASE + '/sets')
      .then(function(res) {
        return res.json().then(function(data) { return { res: res, data: data }; });
      })
      .then(function(r) {
        if (!r.res.ok) {
          setStatus(r.res.status === 429 ? 'Rate limit reached - please try again in a bit.' : 'Error loading sets (' + (r.data.error || r.res.status) + ').');
          return;
        }
        saveSetsCache(r.data.data);
        populateSets(r.data.data);
      })
      .catch(function() { setStatus('Could not load sets. Please refresh.'); });
  }

  function noResultsText() {
    var setSel = document.getElementById('pkw-setFilter');
    var setName = setSel.value ? setSel.options[setSel.selectedIndex].text : '';
    var search = document.getElementById('pkw-search').value.trim();
    if (search && setName) return 'No "' + search + '" cards found in ' + setName + '.';
    if (search) return 'No cards found matching "' + search + '".';
    if (setName) return 'No cards found in ' + setName + '.';
    return 'No cards found.';
  }

  function matchesName(card, term) {
    var name = (card.card_info.clean_name || card.card_info.name || '').toLowerCase();
    return name.indexOf(term.trim().toLowerCase()) !== -1;
  }

  function handleErrorResponse(res, data) {
    setStatus(res.status === 429 ? 'Rate limit reached - please try again in a bit.' : 'Error loading cards (' + (data.error || res.status) + ').');
  }

  function loadCards() {
    var set = document.getElementById('pkw-setFilter').value;
    var search = document.getElementById('pkw-search').value.trim();

    var token = ++loadToken;
    allCards = []; filtered = [];
    currentPage = 1;
    renderedPage = null; renderedCount = 0;
    document.getElementById('pkw-grid').innerHTML = '';
    document.getElementById('pkw-pagination').innerHTML = '';

    if (!set && !search) {
      setStatus('Select a set or search a card name to get started.');
      return;
    }

    var setSel = document.getElementById('pkw-setFilter');
    var setName = set ? setSel.options[setSel.selectedIndex].text : 'All Sets';

    if (set && search) {
      // /sets/:setCode never includes price data (a real API gap), but
      // /search always does. Searching by name and filtering the results
      // to this set's exact set_code gets both correct scoping AND real
      // prices, with no extra requests over a normal name search.
      setStatus('Searching "' + search + '" in ' + setName + '...');
      loadBySearch(search, set, token);
    } else if (set) {
      // Browsing a whole set with no name to search by has to use
      // /sets/:setCode, which means no price data for now (see loadBySet).
      setStatus('Loading ' + setName + '...');
      loadBySet(set, token);
    } else {
      setStatus('Searching "' + search + '" in All Sets...');
      loadBySearch(search, '', token);
    }
  }

  // Browsing an entire set (no search term) uses the dedicated
  // /sets/:setCode endpoint for a reliable card list - but pokewallet.io
  // never includes price data on this endpoint (confirmed against the
  // live API: empty prices arrays regardless of set), so cards here show
  // "No price data" until that's resolved (e.g. via /prices/:setCode).
  function loadBySet(setCode, token) {
    var page = 1;
    showProgress(0);

    function go() {
      fetch(BASE + '/set-cards?set=' + encodeURIComponent(setCode) + '&page=' + page)
        .then(function(res) {
          return res.json().then(function(data) { return { res: res, data: data }; });
        })
        .then(function(r) {
          if (token !== loadToken) return;
          if (!r.res.ok) { hideProgress(); handleErrorResponse(r.res, r.data); return; }

          var results = (r.data.cards || [])
            .filter(function(c) { return c && c.card_info && c.card_info.name; });
          allCards = allCards.concat(results);
          applyFilters(false);

          var rawTotal = r.data.pagination ? r.data.pagination.total : allCards.length;
          setStatus('Loaded ' + allCards.length + ' of ' + rawTotal + ' cards...');
          showProgress(rawTotal ? (allCards.length / rawTotal * 100) : 100);

          var hasMore = r.data.pagination ? page < r.data.pagination.total_pages : false;
          if (hasMore) { page++; go(); }
          else if (token === loadToken) {
            hideProgress();
            setStatus(filtered.length ? filtered.length + ' cards found' : noResultsText());
          }
        })
        .catch(function() { if (token === loadToken) { hideProgress(); setStatus('Failed to load cards. Please try again.'); } });
    }
    go();
  }

  // Searches pokewallet.io's broad full-text search, then filters by name
  // client-side (see matchesName) since that search also matches
  // set/product names, not just card names. When setCode is given, also
  // requires an exact match on the card's own set_code field (reliable -
  // unlike using a set code as query text, this just compares a real
  // returned field) to scope results to one set while keeping real prices.
  function loadBySearch(term, setCode, token) {
    var page = 1;
    showProgress(0);

    function go() {
      fetch(BASE + '/search?q=' + encodeURIComponent(term) + '&page=' + page)
        .then(function(res) {
          return res.json().then(function(data) { return { res: res, data: data }; });
        })
        .then(function(r) {
          if (token !== loadToken) return;
          if (!r.res.ok) { hideProgress(); handleErrorResponse(r.res, r.data); return; }

          var results = (r.data.results || [])
            .filter(function(c) { return c && c.card_info && c.card_info.name; })
            .filter(function(c) { return matchesName(c, term); })
            .filter(function(c) { return !setCode || c.card_info.set_code === setCode; });
          allCards = allCards.concat(results);
          applyFilters(false);

          var rawTotal = r.data.pagination ? r.data.pagination.total : allCards.length;
          var scanned = r.data.pagination ? Math.min(page * r.data.pagination.limit, rawTotal) : allCards.length;
          setStatus('Found ' + allCards.length + ' matching "' + term + '"' + (setCode ? ' in this set' : '') + ' (scanned ' + scanned + ' of ' + rawTotal + ')...');
          showProgress(rawTotal ? (scanned / rawTotal * 100) : 100);

          var hasMore = r.data.pagination ? page < r.data.pagination.total_pages : false;
          if (hasMore) { page++; go(); }
          else if (token === loadToken) {
            hideProgress();
            setStatus(filtered.length ? filtered.length + ' cards found' : noResultsText());
          }
        })
        .catch(function() { if (token === loadToken) { hideProgress(); setStatus('Failed to load cards. Please try again.'); } });
    }
    go();
  }

  function getPrice(card) {
    // pokewallet.io sometimes defaults a price field to 0 instead of null
    // when data is genuinely missing (confirmed: a card with every other
    // Cardmarket field null still had trend:0) - treat non-positive values
    // as unavailable rather than a real $0 price.
    var market = document.getElementById('pkw-market').value;
    if (market === 'tcgplayer') {
      var tp = card.tcgplayer && card.tcgplayer.prices && card.tcgplayer.prices[0];
      return (tp && tp.market_price > 0) ? { value: tp.market_price, source: 'TCGPlayer' } : null;
    }
    var cm = card.cardmarket && card.cardmarket.prices && card.cardmarket.prices[0];
    return (cm && cm.trend > 0) ? { value: cm.trend, source: 'Cardmarket' } : null;
  }

  function applyFilters(resetPage) {
    var sort = document.getElementById('pkw-sort').value;
    filtered = allCards.slice();

    if (sort === 'high') {
      filtered.sort(function(a, b) {
        var pa = getPrice(a), pb = getPrice(b);
        return (pb ? pb.value : -1) - (pa ? pa.value : -1);
      });
    } else if (sort === 'low') {
      filtered.sort(function(a, b) {
        var pa = getPrice(a), pb = getPrice(b);
        if (!pa) return 1;
        if (!pb) return -1;
        return pa.value - pb.value;
      });
    }

    if (resetPage !== false) currentPage = 1;
    render(resetPage !== false || sort !== '');
  }

  function render(forceFresh) {
    var grid = document.getElementById('pkw-grid');
    var pag = document.getElementById('pkw-pagination');
    if (!grid || !pag) return;

    if (!filtered.length) {
      grid.innerHTML = '';
      pag.innerHTML = '';
      renderedPage = null; renderedCount = 0;
      setStatus(noResultsText());
      return;
    }

    var totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    var slice = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    var freshStart = forceFresh || renderedPage !== currentPage || renderedCount > slice.length;
    if (freshStart) {
      grid.innerHTML = '';
      renderedPage = currentPage;
      renderedCount = 0;
    }

    var newDivs = [];
    slice.slice(renderedCount).forEach(function(card) {
      var info = card.card_info;
      var price = getPrice(card);
      var div = document.createElement('div');
      div.className = 'pkw-card';
      div.style.opacity = '0';
      div.style.transition = 'opacity 0.15s ease';
      var img = document.createElement('img');
      img.src = BASE + '/image?id=' + encodeURIComponent(card.id);
      img.alt = info.clean_name || info.name;
      img.onerror = function() {
        this.onerror = null;
        this.src = BASE + '/card-back.png';
      };
      var h3 = document.createElement('h3');
      h3.textContent = (info.clean_name || info.name) + (info.card_number ? ', #' + info.card_number : '');
      var setDiv = document.createElement('div');
      setDiv.className = 'pkw-set';
      setDiv.textContent = info.set_name || '';
      var priceDiv = document.createElement('div');
      priceDiv.className = 'pkw-price' + (price ? '' : ' na');
      if (price) {
        priceDiv.textContent = '$' + price.value.toFixed(2) + ' ';
        var source = document.createElement('span');
        source.className = 'pkw-source';
        source.textContent = price.source;
        priceDiv.appendChild(source);
      } else {
        priceDiv.textContent = 'No price data';
      }
      div.appendChild(img);
      div.appendChild(h3);
      div.appendChild(setDiv);
      div.appendChild(priceDiv);
      div.addEventListener('click', function() { openModal(card); });
      grid.appendChild(div);
      newDivs.push(div);
    });
    requestAnimationFrame(function() {
      newDivs.forEach(function(div) { div.style.opacity = '1'; });
    });
    renderedCount = slice.length;

    pag.innerHTML = '';
    if (totalPages > 1) {
      var prev = document.createElement('button');
      prev.textContent = 'Prev';
      prev.disabled = currentPage === 1;
      prev.onclick = function() { currentPage--; render(); window.scrollTo(0, 0); };
      pag.appendChild(prev);

      for (var i = 1; i <= totalPages; i++) {
        (function(n) {
          if (n === 1 || n === totalPages || Math.abs(n - currentPage) <= 2) {
            var btn = document.createElement('button');
            btn.textContent = n;
            if (n === currentPage) btn.className = 'active';
            btn.onclick = function() { currentPage = n; render(); window.scrollTo(0, 0); };
            pag.appendChild(btn);
          } else if (Math.abs(n - currentPage) === 3) {
            var sp = document.createElement('span');
            sp.textContent = '...';
            sp.style.padding = '6px 4px';
            pag.appendChild(sp);
          }
        })(i);
      }

      var next = document.createElement('button');
      next.textContent = 'Next';
      next.disabled = currentPage === totalPages;
      next.onclick = function() { currentPage++; render(); window.scrollTo(0, 0); };
      pag.appendChild(next);
    }
  }

  document.getElementById('pkw-setFilter').addEventListener('change', loadCards);
  document.getElementById('pkw-market').addEventListener('change', function() { applyFilters(true); });
  document.getElementById('pkw-sort').addEventListener('change', function() { applyFilters(true); });
  document.getElementById('pkw-search').addEventListener('keydown', function(e) { if (e.key === 'Enter') loadCards(); });

  loadSets();
})();
