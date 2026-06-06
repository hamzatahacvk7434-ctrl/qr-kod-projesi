/* ==========================================================================
   QR KOD PRO - UYGULAMA MANTIĞI & ETKİLEŞİM
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let activeTab = 'generate'; // 'generate' | 'scan'
    let scanMode = 'camera'; // 'camera' | 'file'
    let isScanning = false;
    let html5QrCode = null;

    // --- DOM ELEMENTS ---
    
    // Tab Elements
    const btnTabGenerate = document.getElementById('btn-tab-generate');
    const btnTabScan = document.getElementById('btn-tab-scan');
    const panelGenerate = document.getElementById('panel-generate');
    const panelScan = document.getElementById('panel-scan');
    const tabSlider = document.querySelector('.tab-slider');

    // Generator Elements
    const textInput = document.getElementById('text-input');
    const charCounter = document.getElementById('char-counter');
    const selectSize = document.getElementById('select-size');
    const selectEcc = document.getElementById('select-ecc');
    const colorDark = document.getElementById('color-dark');
    const colorLight = document.getElementById('color-light');
    const rangeMargin = document.getElementById('range-margin');
    const marginValue = document.getElementById('margin-value');
    const darkColorHex = document.getElementById('dark-color-hex');
    const lightColorHex = document.getElementById('light-color-hex');
    const btnGenerate = document.getElementById('btn-generate');
    const qrCanvas = document.getElementById('qr-canvas');
    const qrPlaceholder = document.getElementById('qr-placeholder');
    const btnDownload = document.getElementById('btn-download');
    const btnCopy = document.getElementById('btn-copy');
    const btnClearGen = document.getElementById('btn-clear-gen');

    // Scanner Switch Elements
    const btnModeCamera = document.getElementById('btn-mode-camera');
    const btnModeFile = document.getElementById('btn-mode-file');
    const scannerCameraSection = document.getElementById('scanner-camera-section');
    const scannerFileSection = document.getElementById('scanner-file-section');

    // Camera Scanner Elements
    const cameraSelect = document.getElementById('camera-select');
    const btnStartCamera = document.getElementById('btn-start-camera');
    const btnStopCamera = document.getElementById('btn-stop-camera');
    const scannerOverlay = document.getElementById('scanner-overlay');
    const cameraFallback = document.getElementById('camera-fallback');

    // File Scanner Elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const filePreviewCard = document.getElementById('file-preview-card');
    const scannedFilePreview = document.getElementById('scanned-file-preview');
    const btnCancelFile = document.getElementById('btn-cancel-file');

    // Scanner Results Elements
    const scannedResultText = document.getElementById('scanned-result-text');
    const btnResultCopy = document.getElementById('btn-result-copy');
    const btnResultVisit = document.getElementById('btn-result-visit');
    const btnRescan = document.getElementById('btn-rescan');

    // --- TAB SWITCHING SYSTEM ---
    
    function switchTab(tab) {
        if (activeTab === tab) return;
        activeTab = tab;

        if (tab === 'generate') {
            btnTabGenerate.classList.add('active');
            btnTabScan.classList.remove('active');
            panelGenerate.classList.add('active');
            panelScan.classList.remove('active');
            tabSlider.style.transform = 'translateX(0)';
            
            // Stop camera if running when switching away
            stopCameraScan();
        } else {
            btnTabGenerate.classList.remove('active');
            btnTabScan.classList.add('active');
            panelGenerate.classList.remove('active');
            panelScan.classList.add('active');
            tabSlider.style.transform = 'translateX(100%)';
            
            // Scan tab active: Initialize cameras dropdown
            initializeCameras();
        }
    }

    btnTabGenerate.addEventListener('click', () => switchTab('generate'));
    btnTabScan.addEventListener('click', () => switchTab('scan'));


    // --- QR CODE GENERATOR LOGIC ---

    // Update hex texts dynamically on picker change
    colorDark.addEventListener('input', (e) => {
        darkColorHex.textContent = e.target.value.toUpperCase();
        generateQRCode();
    });

    colorLight.addEventListener('input', (e) => {
        lightColorHex.textContent = e.target.value.toUpperCase();
        generateQRCode();
    });

    // Update margin value label
    rangeMargin.addEventListener('input', (e) => {
        marginValue.textContent = e.target.value;
        generateQRCode();
    });

    // Handle character count
    textInput.addEventListener('input', () => {
        const len = textInput.value.length;
        charCounter.textContent = `${len} / 1000`;
        
        // Automatic live generation
        generateQRCode();
    });

    // Trigger on settings changes
    selectSize.addEventListener('change', generateQRCode);
    selectEcc.addEventListener('change', generateQRCode);

    // Button Generate Fallback
    btnGenerate.addEventListener('click', generateQRCode);

    // Main Generate Function
    function generateQRCode() {
        const text = textInput.value;
        
        if (!text || text.trim() === '') {
            // Hide preview, show placeholder
            qrCanvas.style.display = 'none';
            qrPlaceholder.style.display = 'flex';
            
            // Disable actions
            btnDownload.disabled = true;
            btnCopy.disabled = true;
            return;
        }

        // Configuration
        const size = parseInt(selectSize.value);
        const ecc = selectEcc.value;
        const colorDarkVal = colorDark.value;
        const colorLightVal = colorLight.value;
        const marginVal = parseInt(rangeMargin.value);

        const options = {
            width: size,
            margin: marginVal,
            errorCorrectionLevel: ecc,
            color: {
                dark: colorDarkVal,
                light: colorLightVal
            }
        };

        // Render QR Code to Canvas
        QRCode.toCanvas(qrCanvas, text, options, (error) => {
            if (error) {
                console.error("QR Code Generation Error:", error);
                return;
            }
            
            // Show canvas and hide placeholder
            qrCanvas.style.display = 'block';
            qrPlaceholder.style.display = 'none';
            
            // Enable download & copy buttons
            btnDownload.disabled = false;
            btnCopy.disabled = false;
        });
    }

    // Download QR Code as PNG
    btnDownload.addEventListener('click', () => {
        if (btnDownload.disabled) return;
        
        const dataUrl = qrCanvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `qrcode_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });

    // Copy QR Code to Clipboard as Image
    btnCopy.addEventListener('click', () => {
        if (btnCopy.disabled) return;

        try {
            qrCanvas.toBlob((blob) => {
                if (!blob) {
                    console.error("Canvas could not be serialized to Blob");
                    return;
                }
                
                const item = new ClipboardItem({ 'image/png': blob });
                navigator.clipboard.write([item]).then(() => {
                    // Success feedback
                    const originalText = btnCopy.innerHTML;
                    btnCopy.innerHTML = `
                        <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Kopyalandı!
                    `;
                    btnCopy.style.borderColor = 'var(--color-success)';
                    
                    setTimeout(() => {
                        btnCopy.innerHTML = originalText;
                        btnCopy.style.borderColor = '';
                    }, 2000);
                }).catch(err => {
                    console.error("Clipboard copy failed", err);
                    alert("Görsel panoya kopyalanamadı. Tarayıcı izinlerini kontrol edin.");
                });
            }, 'image/png');
        } catch (err) {
            console.error("ClipboardItem not supported or error: ", err);
            alert("Bu tarayıcı görseli panoya kopyalamayı desteklemiyor. Lütfen indirin.");
        }
    });

    // Clear Generator
    btnClearGen.addEventListener('click', () => {
        textInput.value = '';
        charCounter.textContent = '0 / 1000';
        
        // Reset inputs to default
        selectSize.value = "300";
        selectEcc.value = "M";
        colorDark.value = "#0f0c1b";
        colorLight.value = "#ffffff";
        rangeMargin.value = "4";
        marginValue.textContent = "4";
        darkColorHex.textContent = "#0F0C1B";
        lightColorHex.textContent = "#FFFFFF";
        
        // Regenerate (will show placeholder)
        generateQRCode();
    });


    // --- QR CODE SCANNERS LOGIC ---

    // Switch between Camera and File Scan Modes
    function switchScanMode(mode) {
        if (scanMode === mode) return;
        scanMode = mode;

        if (mode === 'camera') {
            btnModeCamera.classList.add('active');
            btnModeFile.classList.remove('active');
            scannerCameraSection.classList.add('active');
            scannerFileSection.classList.remove('active');
            
            // Clean file preview state
            resetFileState();
        } else {
            btnModeCamera.classList.remove('active');
            btnModeFile.classList.add('active');
            scannerCameraSection.classList.remove('active');
            scannerFileSection.classList.add('active');
            
            // Stop camera if running when switching to file
            stopCameraScan();
        }
        
        // Clear result display back to idle
        showResultState('idle');
    }

    btnModeCamera.addEventListener('click', () => switchScanMode('camera'));
    btnModeFile.addEventListener('click', () => switchScanMode('file'));

    // --- CAMERA SCANNERS WORKFLOW ---

    // Initialize/Request Cameras
    function initializeCameras() {
        if (cameraSelect.options.length > 1) {
            // Already initialized
            return;
        }

        Html5Qrcode.getCameras().then(devices => {
            cameraSelect.innerHTML = '';
            
            if (devices && devices.length > 0) {
                devices.forEach((device, index) => {
                    const option = document.createElement('option');
                    option.value = device.id;
                    option.text = device.label || `Kamera ${index + 1}`;
                    cameraSelect.appendChild(option);
                });
            } else {
                const option = document.createElement('option');
                option.value = '';
                option.text = 'Kamera bulunamadı';
                cameraSelect.appendChild(option);
            }
        }).catch(err => {
            console.error("Camera access error:", err);
            cameraSelect.innerHTML = '<option value="">Kamera izni gerekiyor</option>';
        });
    }

    // Start Webcam Stream
    btnStartCamera.addEventListener('click', startCameraScan);

    function startCameraScan() {
        if (isScanning) return;
        
        // Initialize instance if not exists
        if (!html5QrCode) {
            html5QrCode = new Html5Qrcode("reader");
        }

        cameraFallback.classList.add('hidden');
        scannerOverlay.classList.remove('hidden');
        showResultState('idle');

        const selectedCameraId = cameraSelect.value;
        const config = {
            fps: 10,
            qrbox: (width, height) => {
                const minDim = Math.min(width, height);
                const size = Math.floor(minDim * 0.7);
                return { width: size, height: size };
            }
        };

        // If a specific camera is chosen, target it, otherwise default to environment/back camera
        const cameraConfig = selectedCameraId ? { deviceId: { exact: selectedCameraId } } : { facingMode: "environment" };

        html5QrCode.start(
            cameraConfig,
            config,
            (decodedText) => {
                // Successful Scan
                playSuccessBeep();
                handleScanSuccess(decodedText);
            },
            (errorMessage) => {
                // No QR Code found in frame, silent error
            }
        ).then(() => {
            isScanning = true;
            btnStartCamera.classList.add('hidden');
            btnStopCamera.classList.remove('hidden');
        }).catch(err => {
            console.error("Webcam failed to start:", err);
            cameraFallback.classList.remove('hidden');
            scannerOverlay.classList.add('hidden');
            
            showResultState('error');
            document.getElementById('scan-error-msg').textContent = "Kamera başlatılamadı. İzinlerin aktif olduğundan emin olun.";
            
            stopCameraScan();
        });
    }

    // Stop Webcam Stream
    btnStopCamera.addEventListener('click', stopCameraScan);

    function stopCameraScan() {
        if (!html5QrCode || !isScanning) {
            return Promise.resolve();
        }

        return html5QrCode.stop().then(() => {
            isScanning = false;
            btnStartCamera.classList.remove('hidden');
            btnStopCamera.classList.add('hidden');
            scannerOverlay.classList.add('hidden');
            cameraFallback.classList.remove('hidden');
        }).catch(err => {
            console.error("Webcam failed to stop:", err);
        });
    }


    // --- FILE SCANNER WORKFLOW ---

    // Drag-over highlights
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'dragend', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
        }, false);
    });

    // File dropped
    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            fileInput.files = files;
            handleFileScan(files[0]);
        }
    });

    // File selected via Dialog box
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileScan(e.target.files[0]);
        }
    });

    // Process file QR Scan
    function handleFileScan(file) {
        if (!file) return;

        // Switch Result section state to scanning
        showResultState('scanning');

        // Render selected image as preview
        const reader = new FileReader();
        reader.onload = (e) => {
            scannedFilePreview.src = e.target.result;
            dropZone.classList.add('hidden');
            filePreviewCard.classList.remove('hidden');
        };
        reader.readAsDataURL(file);

        // Instantiate scanner for file reading if not exists
        if (!html5QrCode) {
            html5QrCode = new Html5Qrcode("reader");
        }

        // Programmatic file decoding
        // Second parameter is false so it doesn't try to render inside the webcam container
        html5QrCode.scanFile(file, false)
            .then(decodedText => {
                playSuccessBeep();
                handleScanSuccess(decodedText);
            })
            .catch(err => {
                console.error("File decode error:", err);
                showResultState('error');
                document.getElementById('scan-error-msg').textContent = "Bu görselde geçerli bir QR kod algılanamadı.";
            });
    }

    // Cancel file selection
    btnCancelFile.addEventListener('click', resetFileState);

    function resetFileState() {
        fileInput.value = '';
        scannedFilePreview.src = '';
        dropZone.classList.remove('hidden');
        filePreviewCard.classList.add('hidden');
        showResultState('idle');
    }


    // --- GENERAL SCAN SUCCESS LOGIC ---

    function handleScanSuccess(decodedText) {
        // Stop camera stream on successful scan
        if (isScanning) {
            stopCameraScan();
        }

        // Set result value
        scannedResultText.value = decodedText;

        // Check if value is URL
        if (isValidUrl(decodedText)) {
            btnResultVisit.href = decodedText;
            btnResultVisit.classList.remove('hidden');
        } else {
            btnResultVisit.href = '#';
            btnResultVisit.classList.add('hidden');
        }

        // Show Success pane
        showResultState('success');
    }

    // Result pane states control
    function showResultState(state) {
        const states = ['idle', 'scanning', 'error', 'success'];
        states.forEach(s => {
            const el = document.getElementById(`result-state-${s}`);
            if (s === state) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
    }

    // Rescan button
    btnRescan.addEventListener('click', () => {
        showResultState('idle');
        
        if (scanMode === 'camera') {
            startCameraScan();
        } else {
            resetFileState();
        }
    });

    // Copy Text Result
    btnResultCopy.addEventListener('click', () => {
        const text = scannedResultText.value;
        if (!text) return;

        navigator.clipboard.writeText(text).then(() => {
            const originalText = btnResultCopy.innerHTML;
            btnResultCopy.innerHTML = `
                <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Kopyalandı!
            `;
            btnResultCopy.style.borderColor = 'var(--color-success)';
            
            setTimeout(() => {
                btnResultCopy.innerHTML = originalText;
                btnResultCopy.style.borderColor = '';
            }, 2000);
        }).catch(err => {
            console.error("Text copy failed", err);
            alert("Metin kopyalanamadı.");
        });
    });


    // --- UTILITIES ---

    // Play synthesis sound on scan success
    function playSuccessBeep() {
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return;
            
            const audioCtx = new AudioContextClass();
            
            // Double beep
            const playTone = (freq, duration, delay) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
                
                gain.gain.setValueAtTime(0, audioCtx.currentTime + delay);
                gain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + delay + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + delay + duration);
                
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                
                osc.start(audioCtx.currentTime + delay);
                osc.stop(audioCtx.currentTime + delay + duration);
            };

            playTone(880, 0.1, 0); // Short high A5 note
            playTone(1320, 0.15, 0.07); // Short higher E6 note
        } catch (e) {
            console.warn("Audio Context is blocked or not supported:", e);
        }
    }

    // Verify if string is url
    function isValidUrl(string) {
        try {
            // Must begin with protocol to prevent relative links
            if (!/^https?:\/\//i.test(string)) {
                return false;
            }
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
    
    // Initial generation (if text box contains anything on load)
    generateQRCode();
});
