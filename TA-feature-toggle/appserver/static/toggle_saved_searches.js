require([
    'jquery', // jQuery for AJAX calls and DOM manipulation
    'splunkjs/mvc', // Core Splunk MVC components for models and views
    'splunkjs/mvc/simplexml/ready!' // Ensures code executes after the dashboard is fully loaded
  ], function($, mvc) {
    // Base configuration variables
    var baseUrl = '/en-US/splunkd/__raw';
    var appOwner = 'nobody';
    var appName = 'TA-HSBC_secops';
    var featureToggleStore = baseUrl + '/servicesNS/' + appOwner + '/' + appName + '/storage/collections/data/feature_toggle';
    var auditStore = baseUrl + '/servicesNS/' + appOwner + '/' + appName + '/storage/collections/data/feature_toggle_audit';
  
    var confettiAnimation; // To keep track of the confetti animation frame
  
    // Fetch the current user's username securely from the Splunk API
    function getCurrentUser(callback) {
        $.get(baseUrl + '/services/authentication/current-context', function(data) {
            var username = $(data).find('username').text();
            callback(username);
        }).fail(function() {
            callback('unknown'); // Fallback to 'unknown' if the API call fails
        });
    }
  
    var currentUser; // Variable to store the current user's username
  
    // Initialize dashboard functionalities after fetching the user
    getCurrentUser(function(username) {
        currentUser = username;
        console.log('Current user:', currentUser);
        fetchData(); // Fetch data after ensuring the user is set
    });
  
    // Log changes to the feature_toggle_audit KV Store
    function logAudit(hsbc_uc_id, enabled) {
        var auditData = {
            _time: new Date().toISOString(),
            user: currentUser,
            hsbc_uc_id: hsbc_uc_id,
            status: enabled
        };
  
        $.ajax({
            url: auditStore,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(auditData),
            success: function() {
                console.log('Audit log entry created successfully.');
            },
            error: function(xhr, status, error) {
                console.error('Failed to log audit entry:', status, error);
            }
        });
    }
  
    // Update the feature toggle status in the KV Store
    function updateKVStore(hsbc_uc_id, enabled) {
        var data = JSON.stringify({ hsbc_uc_id: hsbc_uc_id, enabled: enabled });
  
        $.ajax({
            url: featureToggleStore + '/' + hsbc_uc_id,
            type: 'POST',
            contentType: 'application/json',
            data: data,
            success: function(response) {
                console.log('KV store updated successfully.');
                logAudit(hsbc_uc_id, enabled); // Log to audit KV store after successful update
                handleConfetti(enabled); // Manage confetti based on toggle status
            },
            error: function(xhr, status, error) {
                console.error('Failed to update KV store:', status, error);
            }
        });
    }
  
    // Fetch existing toggle data from the KV Store
    function fetchData() {
        $.ajax({
            url: featureToggleStore,
            type: 'GET',
            success: function(data) {
                renderToggles(data);
            },
            error: function(xhr, status, error) {
                console.error('Failed to fetch data from KV store:', status, error);
            }
        });
    }
  
    // Render toggles in the dashboard
    function renderToggles(data) {
        var $tableBody = $('#toggle-table tbody');
        $tableBody.empty();
        data.forEach(function(item) {
            $tableBody.append(createToggleRow(item.hsbc_uc_id, item.enabled));
        });
  
        // Setup event listeners for toggle changes
        $tableBody.find('input[type="checkbox"]').change(function() {
            var hsbc_uc_id = $(this).closest('tr').data('id');
            var newEnabled = $(this).is(':checked') ? 'true' : 'false';
            updateKVStore(hsbc_uc_id, newEnabled);
        });
    }
  
    // Create HTML for each toggle row
    function createToggleRow(hsbc_uc_id, enabled) {
        const checked = enabled === 'true' ? 'checked' : '';
        return `<tr data-id="${hsbc_uc_id}">
                    <td>${hsbc_uc_id}</td>
                    <td>
                        <label class="toggle-switch">
                            <input type="checkbox" ${checked}>
                            <span class="slider round"></span>
                        </label>
                    </td>
                </tr>`;
    }
  
    // Handle the confetti effect based on toggle state
    function handleConfetti(enabled) {
        if (enabled === 'true') {
            startConfetti();
            setTimeout(stopConfetti, 3000); // Stop the confetti after 3 seconds
        } else {
            stopConfetti(); // Immediately stop the confetti if the toggle is disabled
        }
    }
  
    // Start the confetti effect
    function startConfetti() {
        var canvas = document.getElementById('confettiCanvas');
        if (!canvas) {
            $('body').append('<canvas id="confettiCanvas" style="position: fixed; top: 0; left: 0; height: 100%; width: 100%; pointer-events: none; z-index: 999;"></canvas>');
            canvas = document.getElementById('confettiCanvas');
        }
        var ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
  
        var confettiColors = ['#f00', '#0f0', '#00f', '#ff0', '#f0f', '#0ff'];
        var confettiParticles = Array(100).fill().map(() => ({
            color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            diameter: Math.random() * 10 + 5,
            tilt: Math.random() * 10 - 5,
            tiltAngleIncremental: Math.random() * 0.07 + 0.05,
            tiltAngle: 0
        }));
  
        function updateConfetti() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
  
            confettiParticles.forEach(function(particle, index) {
                particle.tiltAngle += particle.tiltAngleIncremental;
                particle.y += (Math.cos(particle.tiltAngle) + 3 + particle.diameter / 2) / 2;
                particle.tilt = Math.sin(particle.tiltAngle) * 15;
  
                if (particle.y > canvas.height) {
                    confettiParticles[index] = {
                        color: particle.color,
                        x: Math.random() * canvas.width,
                        y: -10,
                        diameter: particle.diameter,
                        tilt: particle.tilt,
                        tiltAngleIncremental: particle.tiltAngleIncremental,
                        tiltAngle: particle.tiltAngle
                    };
                }
  
                ctx.beginPath();
                ctx.lineWidth = particle.diameter;
                ctx.strokeStyle = particle.color;
                ctx.moveTo(particle.x + particle.tilt + particle.diameter / 2, particle.y);
                ctx.lineTo(particle.x + particle.tilt, particle.y + particle.tilt + particle.diameter / 2);
                ctx.stroke();
            });
  
            confettiAnimation = requestAnimationFrame(updateConfetti);
        }
  
        updateConfetti();
    }
  
    // Stop the confetti effect
    function stopConfetti() {
        var canvas = document.getElementById('confettiCanvas');
        if (canvas) {
            cancelAnimationFrame(confettiAnimation); // Stop the animation
            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
        }
    }
  });
  