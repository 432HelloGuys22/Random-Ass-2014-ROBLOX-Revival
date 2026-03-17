(function (window, undefined) {

    var document = window.document,
        firstScript = document.getElementsByTagName('script')[0],
        isString = function (o) {
            return typeof o == 'string';
        },
        isArray = function (o) {
            return Object.prototype.toString.call(o) == '[object Array]';
        },
        isFunction = function (o) {
            return Object.prototype.toString.call(o) == '[object Function]';
        },
        resourceMap = {},
        config = {
            baseUrl: '',
            modulePath: '/js/modules',
            paths: {},
            externalResources: []
        };


    function deepGet(object, property) {
        var parts = property.split('.');
        for (property = parts.shift(); parts.length > 0; object = object[property], property = parts.shift()) {
            if (object[property] === undefined)
                return undefined;
        }
        return object[property];
    }

    function deepSet(object, property, value) {
        var parts = property.split('.');
        for (property = parts.shift(); parts.length > 0; object = object[property], property = parts.shift()) {
            if (object[property] === undefined)
                object[property] = {};
        }
        object[property] = value;
    }

    function loadCss(href, onload) {
        var link = document.createElement('link');
        link.href = href;
        link.rel = 'stylesheet';
        link.type = 'text/css';
        firstScript.parentNode.insertBefore(link, firstScript);
        onload();
    }

    function loadJs(src, onload) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = src;
        script.onload = script.onreadystatechange = function () {
            if (!script.readyState || script.readyState == 'loaded' || script.readyState == 'complete') {
                onload();

                // Handle memory leak in IE
                script.onload = script.onreadystatechange = null;
            }
        };
        firstScript.parentNode.insertBefore(script, firstScript);
    }

    function getExtension(url) {
        return url.split('.').pop().split('?').shift();
    }

    function getResourceName(url) {
        // Check if it's already a name
        if (url.indexOf('.js') < 0)
            return url;

        // Pull out the name if it's a module
        if (url.indexOf(config.modulePath) >= 0)
            return url.split(config.modulePath + '/').pop().split('.').shift().replace('/', '.');

        // Check paths config
        for (var name in config.paths) {
            if (config.paths[name] == url)
                return name;
        }

        // Resource isn't a module, use url for name
        return url;
    }

    function getResourceUrl(name) {
        // Check if it's already a url
        if (name.indexOf('.js') >= 0 || name.indexOf('.css') >= 0)
            return name;

        return config.paths[name] || config.baseUrl + config.modulePath + '/' + name.replace('.', '/') + '.js';
    }

    function getModules(resources) {
        var module, modules = [];
        for (var i = 0; i < resources.length; i++) {
            module = deepGet(Roblox, getResourceName(resources[i]));
            if (module !== undefined)
                modules.push(module);
        }
        return modules;
    }

    function resolveResource(name) {
        var resource = resourceMap[name];
        if (!resource.loaded || !resource.depsLoaded)
            return;

        // Notify listeners
        while (resource.listeners.length > 0) {
            (resource.listeners.shift())();
        }
    }

    function loadResource(nameOrUrl, onload) {
        if (!isString(nameOrUrl) || config.externalResources.toString().indexOf(nameOrUrl) >= 0)
            return onload();

        var name = getResourceName(nameOrUrl);
        if (resourceMap[name] === undefined) {
            resourceMap[name] = {
                loaded: false,
                depsLoaded: true,
                listeners: []
            };
            resourceMap[name].listeners.push(onload);

            var url = getResourceUrl(name),
                load = getExtension(url) == 'css' ? loadCss : loadJs;
            load(url, function () {
                resourceMap[name].loaded = true;
                resolveResource(name);
            });
        }
        else {
            // Wait for resource to load
            resourceMap[name].listeners.push(onload);
            resolveResource(name);
        }
    }

    function loadResourceChain(urls, onload) {
        var first = urls.shift(),
            chainload = (urls.length == 0) ? onload : function () { loadResourceChain(urls, onload) };

        loadResource(first, chainload);
    }

    /**
    *
    *  Ensures all dependencies are loaded before executing the callback
    *
    *  @param {String|Array} - One or more dependencies to wait for
    *  @param {Function} - The callback to execute when all dependencies are ready
    *
    **/
    function require(dependencies, onready) {
        if (!isArray(dependencies))
            dependencies = [dependencies];

        var onload = function () {
            onready.apply(null, getModules(dependencies));
        };

        // Load resources from copy array
        loadResourceChain(dependencies.slice(0), onload);
    }

    /**
    *
    *  Defines a module onto the global Roblox object
    *
    *  @param {String} - The name of the module (MUST correlate to path in modules folder, i.e. modules/Pagelets/BestFriends.js would be named Pagelets.BestFriends)
    *  @param {String|Array} - An optional list of dependencies
    *  @param {Function} - Factory function to create the module
    *
    **/
    function define(name, dependencies, factory) {
        // Check for no dependency alternate syntax
        if (isFunction(dependencies)) {
            factory = dependencies;
            dependencies = [];
        }
        else if (!isArray(dependencies)) {
            dependencies = [dependencies];
        }

        resourceMap[name] = resourceMap[name] || { loaded: true, listeners: [] };
        resourceMap[name].depsLoaded = false;
        resourceMap[name].listeners.unshift(function () {
            // Add module to Roblox object
            deepSet(Roblox, name, factory.apply(null, getModules(dependencies)));
        });

        require(dependencies, function () {
            resourceMap[name].depsLoaded = true;
            resolveResource(name);
        });
    }

    if (typeof Roblox === 'undefined') {
        Roblox = {};

        Roblox.config = config;
        Roblox.require = require;
        Roblox.define = define;
    }

})(window);
Roblox.LoginHandler = {
    // --- NEW: Redirect if already logged in ---
    checkIfLoggedIn: function() {
        var user = localStorage.getItem('RobloxUser');
        // If we find a user and the current page is Login.html
        if (user && window.location.pathname.includes("Login.html")) {
            window.location.href = "index.html";
        }
    },

    doLogin: function() {
        var name = document.getElementById('username-input').value;
        if (name) {
            localStorage.setItem('RobloxUser', name);
            window.location.href = "index.html";
        }
    },

    updateNavigation: function() {
        var savedName = localStorage.getItem('RobloxUser');
        if (savedName) {
            var signupText = document.getElementById('header-signup-text');
            if (signupText) signupText.innerText = savedName;

            var orText = document.getElementById('header-or-text');
            if (orText) orText.style.display = 'none';

            var loginBtnText = document.getElementById('header-login-btn');
            if (loginBtnText) {
                loginBtnText.innerText = "Logout";
                document.getElementById('header-login').href = "javascript:Roblox.LoginHandler.logout()";
            }
        }
    },

    logout: function() {
        localStorage.removeItem('RobloxUser');
        window.location.reload();
    }
};
window.addEventListener('load', function() {
    Roblox.LoginHandler.checkIfLoggedIn();
    Roblox.LoginHandler.updateNavigation();
    
    // Existing functions
    if (typeof loadManageList === "function") loadManageList();
    if (typeof loadHomeUsername === "function") loadHomeUsername();
    
    // Load the shared feed!
    loadFeed(); 
});
// Update this line to run BOTH functions when the page loads
window.addEventListener('load', function() {
    Roblox.LoginHandler.checkIfLoggedIn();
    Roblox.LoginHandler.updateNavigation();
    
    // This is the "Spark" that makes your creations appear!
    loadManageList(); 
});
function publishGame() {
    var name = document.getElementById('dev-game-name').value;
    var thumb = document.getElementById('dev-game-thumb').value;

    if (!name || !thumb) {
        alert("Fill out both boxes!");
        return;
    }

    var userGames = JSON.parse(localStorage.getItem('UserGames')) || [];
    var newGame = {
        id: Date.now(),
        name: name,
        thumb: thumb,
        creator: localStorage.getItem('RobloxUser') || "Guest"
    };

    userGames.push(newGame);
    localStorage.setItem('UserGames', JSON.stringify(userGames));
    
    alert("Game Published!");
    window.location.href = "Games.html";
}
function loadManageList() {
    var userGames = JSON.parse(localStorage.getItem('UserGames')) || [];
    var listContainer = document.getElementById('manage-games-list');
    
    if (listContainer) {
        listContainer.innerHTML = ""; 

        userGames.forEach(function(game) {
            listContainer.innerHTML += `
                <div style="display:flex; align-items:center; justify-content:space-between; padding:10px; border-bottom:1px solid #ccc; background:#fff; margin-bottom:5px;">
                    <span style="font-family:Arial; font-size:13px; font-weight:bold;">${game.name}</span>
                    
                    <div style="display:flex; gap:10px; align-items:center;">
                        <div class="dropdown">
                            <div class="button">Text Label</div>
                            <ul class="dropdown-list">
                                <li><a>Widgets Page</a></li>
                                <li><a>Reference Page</a></li>
                            </ul>
                        </div>

                        <div class="dropdown">
                            <div class="button gear"></div>
                            <ul class="dropdown-list">
                                <li><a>Widgets Page</a></li>
                                <li><a>Buttons Reference Page</a></li>
                                <li style="padding:5px 10px;">
                                    <a class="btn-small btn-negative" onclick="deleteGame(${game.id})" style="cursor:pointer; display:block; text-align:center;">
                                        Delete Place
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>`;
        });
    }
}

function deleteGame(gameId) {
    if (confirm("Are you sure you want to delete this place?")) {
        var userGames = JSON.parse(localStorage.getItem('UserGames')) || [];
        var updated = userGames.filter(g => g.id !== gameId);
        localStorage.setItem('UserGames', JSON.stringify(updated));
        loadManageList();
    }
}
function loadManageList() {
    var userGames = JSON.parse(localStorage.getItem('UserGames')) || [];
    var listContainer = document.getElementById('manage-games-list');
    
    if (listContainer) {
        listContainer.innerHTML = ""; // Clear the "empty" message

        if (userGames.length === 0) {
            listContainer.innerHTML = "<p style='padding:10px; color:#666;'>No creations found.</p>";
            return;
        }

        userGames.forEach(function(game) {
    listContainer.innerHTML += `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; border: 1px solid #ccc; background: #fff; margin-bottom: 5px; border-radius: 3px;">
            <span style="font-family: Arial; font-size: 13px; font-weight: bold; color: #333;">${game.name}</span>
            
            <a class="btn-small btn-negative" 
               onclick="deleteGame(${game.id})" 
               style="cursor: pointer; text-decoration: none; min-width: 80px; text-align: center;">
               Delete
            </a>
        </div>`;
        });
    }
}
function postToFeed() {
    var statusText = document.getElementById('status-input').value;
    var feedContainer = document.getElementById('feed-container');
    var emptyMsg = document.getElementById('empty-feed-msg');
    var user = localStorage.getItem('RobloxUser') || "Guest";

    if (statusText.trim() === "") {
        alert("Please enter a status!");
        return;
    }

    // Hide the "empty" message if it exists
    if (emptyMsg) emptyMsg.style.display = 'none';

    // Create the feed item HTML
    var feedItem = `
        <div style="padding: 10px; border-bottom: 1px solid #eee; display: flex; gap: 10px; align-items: flex-start;">
            <img src="https://static.wikia.nocookie.net/mugen/images/d/d1/Newbie.png" style="width: 32px; border: 1px solid #ccc;">
            <div>
                <div style="color: #095fb5; font-weight: bold; font-size: 12px;">${user}</div>
                <div style="font-size: 13px; color: #333; margin-top: 2px;">${statusText}</div>
            </div>
        </div>
    `;

    // Add to the top of the feed and clear the input
    feedContainer.insertAdjacentHTML('afterbegin', feedItem);
    document.getElementById('status-input').value = "";
}
// Add this function at the very bottom
function loadHomeUsername() {
    var user = localStorage.getItem('RobloxUser') || "Guest";
    var element = document.getElementById('welcome-message');
    if (element) {
        element.innerText = "Hello, " + user + "!";
    }
}

// This block starts before your listener
Roblox.LoginHandler.checkIfLoggedIn = function() {
    var user = localStorage.getItem('RobloxUser');
    var path = window.location.pathname;
    var page = path.split("/").pop();

    if (user && (page === "index.html" || page === "")) {
        window.location.href = "YourProfile.html";
    } 
    else if (!user && page === "YourProfile.html") {
        window.location.href = "index.html";
    }
}; 
// It ends here.
    Roblox.LoginHandler.checkIfLoggedIn();
    Roblox.LoginHandler.updateNavigation();
    loadHomeUsername(); // <--- Add this line
;
function postToFeed() {
    var statusInput = document.getElementById('status-input');
    var statusText = statusInput.value;
    var user = localStorage.getItem('RobloxUser') || "Guest";

    if (statusText.trim() === "") return;

    // 1. Get existing feed or start new array
    var feedData = JSON.parse(localStorage.getItem('GlobalFeed')) || [];

    // 2. Add new post to the top of the array
    feedData.unshift({
        username: user,
        content: statusText,
        date: new Date().toLocaleDateString()
    });

    // 3. Save back to localStorage
    localStorage.setItem('GlobalFeed', JSON.stringify(feedData));

    // 4. Clear input and reload the visual list
    statusInput.value = "";
    loadFeed();
}

function loadFeed() {
    var feedContainer = document.getElementById('feed-container');
    var emptyMsg = document.getElementById('empty-feed-msg');
    var feedData = JSON.parse(localStorage.getItem('GlobalFeed')) || [];

    if (!feedContainer) return;

    // Hide empty message if there are posts
    if (feedData.length > 0 && emptyMsg) {
        emptyMsg.style.display = 'none';
    }

    // Map through data to create the posts
    feedContainer.innerHTML = feedData.map(post => `
        <div style="padding: 10px; border-bottom: 1px solid #eee; display: flex; gap: 10px; align-items: flex-start;">
            <img src="https://static.wikia.nocookie.net/mugen/images/d/d1/Newbie.png" style="width: 32px; border: 1px solid #ccc;">
            <div>
                <div style="color: #095fb5; font-weight: bold; font-size: 12px;">${post.username}</div>
                <div style="font-size: 13px; color: #333; margin-top: 2px;">${post.content}</div>
            </div>
        </div>
    `).join('');
}
