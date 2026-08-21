/**
 * Locals Go WebAR Treasure Hunt App
 * Three.js + AR.js Integration
 * Defensive fallback UI for missing AR assets
 * Supabase backend integration for check-ins
 */

class LocalsGoARApp {
    constructor() {
        this.arAvailable = false;
        this.cameraActive = false;
        this.currentCheckpoint = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.arController = null;
        this.trackingQuality = 'unknown';
        this.fallbackActive = false;
        this.checkInLogged = false;

        this.elements = {
            arCanvas: document.getElementById('arCanvas'),
            fallbackUI: document.getElementById('fallback-ui'),
            arStatus: document.getElementById('ar-status'),
            errorMessage: document.getElementById('error-message'),
            errorText: document.getElementById('error-text'),
            checkpointOverlay: document.getElementById('checkpoint-overlay'),
            cameraPermissionBanner: document.getElementById('camera-permission-banner'),
        };

        this.init();
    }

    async init() {
        console.log('🎮 Locals Go AR App initializing...');
        this.updateStatus('Checking device compatibility...');

        // Check for WebAR support
        const hasWebAR = await this.checkWebARSupport();

        if (!hasWebAR) {
            this.showError('WebAR not supported on this device. Using fallback mode.');
            this.enterFallbackMode();
            return;
        }

        // Request camera permission
        const cameraGranted = await this.requestCameraPermission();
        if (!cameraGranted) {
            this.showError('Camera access denied. Switching to fallback mode.');
            this.enterFallbackMode();
            return;
        }

        // Initialize AR scene
        try {
            await this.initARScene();
            this.arAvailable = true;
            this.cameraActive = true;
            this.elements.cameraPermissionBanner.style.display = 'none';
        } catch (err) {
            console.error('❌ AR initialization failed:', err);
            this.showError('AR initialization failed: ' + err.message);
            this.enterFallbackMode();
        }
    }

    async checkWebARSupport() {
        // Check for ARCore (Android) or ARKit (iOS) via AR.js detection
        return !!navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia;
    }

    async requestCameraPermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false,
            });
            // Stop the stream; we're just checking permission
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (err) {
            console.error('❌ Camera permission denied:', err);
            return false;
        }
    }

    async initARScene() {
        this.updateStatus('Initializing AR scene...');

        // Three.js scene setup
        this.scene = new THREE.Scene();
        this.scene.background = null;

        // Camera
        this.camera = new THREE.Camera();
        this.scene.add(this.camera);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.elements.arCanvas,
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true,
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 0);

        // AR.js Controller
        this.arController = new THREEx.ArToolkitContext({
            cameraParametersUrl: 'https://raw.githubusercontent.com/jeromeetienne/AR.js/master/data/data/camera_para.dat',
            detectionMode: 'mono',
            canvasWidth: 80 * 4,
            canvasHeight: 60 * 4,
        });

        // Initialize AR controller
        await new Promise((resolve, reject) => {
            this.arController.init(() => resolve(), (err) => reject(err));
        });

        // ARToolkit source
        const arSource = new THREEx.ArToolkitSource({
            sourceType: 'webcam',
            sourceWidth: this.arController.parameters.canvasWidth,
            sourceHeight: this.arController.parameters.canvasHeight,
        });

        await new Promise((resolve) => {
            arSource.init(() => resolve());
        });

        // Resize handling
        window.addEventListener('resize', () => this.onWindowResize());
        this.onWindowResize();

        // Marker tracking
        this.setupMarkerTracking();

        // Start render loop
        this.render();

        // Get checkpoint data from URL params
        await this.loadCheckpointData();

        this.updateStatus('Ready! Point camera at a QR code...');
        this.elements.fallbackUI.style.display = 'none';
    }

    setupMarkerTracking() {
        // Create a marker group for tracking
        this.markerGroup = new THREE.Group();
        this.markerGroup.name = 'markerGroup';
        this.scene.add(this.markerGroup);

        // Initialize AR marker controller
        this.markerControls = new THREEx.ArMarkerControls(this.arController, this.markerGroup, {
            type: 'barcode',
            barcodeValue: 0,
            changeMatrixMode: 'cameraTransformMatrix',
        });

        // Marker detected callback
        this.markerGroup.addEventListener('markerFound', () => this.onMarkerDetected());
        this.markerGroup.addEventListener('markerLost', () => this.onMarkerLost());
    }

    onMarkerDetected() {
        console.log('✅ Marker detected!');
        this.trackingQuality = 'tracking';

        // Show checkpoint overlay
        if (this.currentCheckpoint) {
            this.showCheckpointOverlay();
            this.logCheckIn();
        }
    }

    onMarkerLost() {
        console.log('⚠️ Marker lost');
        this.trackingQuality = 'lost';
        this.elements.checkpointOverlay.style.display = 'none';
    }

    async loadCheckpointData() {
        // Parse URL params for checkpoint ID
        const params = new URLSearchParams(window.location.search);
        const checkpointId = params.get('checkpoint_id');
        const businessId = params.get('business_id');

        if (!checkpointId || !businessId) {
            this.showError('Missing checkpoint or business ID in URL.');
            return;
        }

        try {
            // Fetch checkpoint data from Supabase
            // Assumes supabase-checkin.js is loaded with SupabaseClient
            if (typeof SupabaseClient === 'undefined') {
                console.warn('⚠️ SupabaseClient not available; using mock data');
                this.currentCheckpoint = this.getMockCheckpointData();
                return;
            }

            // Fetch from lg_checkpoints table
            const { data, error } = await SupabaseClient
                .from('lg_checkpoints')
                .select('*')
                .eq('id', checkpointId)
                .single();

            if (error) throw error;
            this.currentCheckpoint = data;
            this.renderCheckpointCard(data);
        } catch (err) {
            console.error('❌ Failed to load checkpoint:', err);
            this.currentCheckpoint = this.getMockCheckpointData();
            this.renderCheckpointCard(this.currentCheckpoint);
        }
    }

    getMockCheckpointData() {
        return {
            id: 'demo-1',
            business_name: 'Local Coffee Co.',
            points: 50,
            product_name: 'Golden Espresso',
            product_description: 'Premium local roast',
            product_price: 'Free',
            asset_url: null, // No asset = fallback UI
            ar_model_url: null,
        };
    }

    renderCheckpointCard(checkpoint) {
        // Populate checkpoint card in overlay
        document.getElementById('business-name').textContent = checkpoint.business_name;
        document.getElementById('business-name-ar').textContent = checkpoint.business_name;
        document.getElementById('points-badge').textContent = `+${checkpoint.points} pts`;
        document.getElementById('points-badge-ar').textContent = `+${checkpoint.points} pts`;
        document.getElementById('product-name').textContent = checkpoint.product_name || 'Treasure Reward';
        document.getElementById('product-name-ar').textContent = checkpoint.product_name || 'Treasure Reward';
        document.getElementById('product-description-ar').textContent = checkpoint.product_description || 'Unlock exclusive rewards';
        document.getElementById('product-price').textContent = checkpoint.product_price || 'Free';
        document.getElementById('product-price-ar').textContent = checkpoint.product_price || 'Free';

        // Load AR asset or show fallback
        if (checkpoint.asset_url) {
            this.loadARAsset(checkpoint.asset_url);
        } else {
            this.showAssetFallback();
        }

        // Bind Add to Order button
        document.getElementById('add-to-order-btn').onclick = () => this.addToOrder(checkpoint);
        document.getElementById('add-to-order-btn-ar').onclick = () => this.addToOrder(checkpoint);
    }

    loadARAsset(assetUrl) {
        // Load 2D texture or 3D model as AR overlay
        // For now, render a textured plane at the marker
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(assetUrl, (texture) => {
            const geometry = new THREE.PlaneGeometry(2, 2);
            const material = new THREE.MeshStandardMaterial({ map: texture });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.z = 0;
            this.markerGroup.add(mesh);
        }, undefined, (err) => {
            console.error('❌ Failed to load asset texture:', err);
            this.showAssetFallback();
        });
    }

    showAssetFallback() {
        // Swap to fallback state (pin icon + "Photo coming soon")
        const assetCircle = document.getElementById('asset-circle-ar');
        if (!assetCircle.querySelector('.fallback-asset')) {
            assetCircle.innerHTML = `
                <div class="pin-glow">
                    <svg class="pin-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12c0 7 10 13 10 13s10-6 10-13c0-5.52-4.48-10-10-10zm0 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" fill="currentColor"/>
                    </svg>
                </div>
                <p class="photo-coming-soon">Photo coming soon</p>
            `;
            assetCircle.classList.add('fallback-asset');
        }
    }

    showCheckpointOverlay() {
        this.elements.checkpointOverlay.style.display = 'flex';
    }

    async logCheckIn() {
        if (this.checkInLogged || !this.currentCheckpoint) return;

        try {
            const params = new URLSearchParams(window.location.search);
            const playerId = params.get('player_id') || 'anonymous';

            // Log check-in event to Supabase
            if (typeof SupabaseClient !== 'undefined') {
                const { error } = await SupabaseClient
                    .from('lg_checkin_events')
                    .insert([{
                        player_id: playerId,
                        checkpoint_id: this.currentCheckpoint.id,
                        business_id: this.currentCheckpoint.business_id,
                        timestamp: new Date().toISOString(),
                        ar_triggered: true,
                    }]);

                if (error) throw error;
                console.log('✅ Check-in logged');
                this.checkInLogged = true;
            }
        } catch (err) {
            console.error('⚠️ Failed to log check-in:', err);
        }
    }

    addToOrder(checkpoint) {
        // Add item to player's order in Supabase
        console.log('📦 Adding to order:', checkpoint.product_name);
        // Trigger local order tracking or navigate to cart
        window.location.href = `../dashboard/?add_product=${checkpoint.id}`;
    }

    enterFallbackMode() {
        this.fallbackActive = true;
        this.arAvailable = false;
        this.elements.fallbackUI.style.display = 'flex';
        this.elements.arCanvas.style.display = 'none';
        this.elements.cameraPermissionBanner.style.display = 'none';

        // Load checkpoint data and display card
        this.loadCheckpointData();
        document.getElementById('checkpoint-card').style.display = 'block';
    }

    render = () => {
        requestAnimationFrame(this.render);

        if (!this.arAvailable || !this.arController) return;

        // Update AR controller
        this.arController.update(this.arController.arSource.domElement);
        this.camera.projectionMatrix.copy(this.arController.getProjectionMatrix());

        // Render scene
        this.renderer.render(this.scene, this.camera);
    };

    onWindowResize() {
        if (!this.arController) return;
        this.arController.onWindowResize();
        this.camera.projectionMatrix.copy(this.arController.getProjectionMatrix());
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    updateStatus(message) {
        this.elements.arStatus.textContent = message;
    }

    showError(message) {
        console.error('🔴', message);
        this.elements.errorText.textContent = message;
        this.elements.errorMessage.style.display = 'block';
        this.elements.arStatus.style.display = 'none';
    }
}

// Global function to close overlay
function closeCheckpointOverlay() {
    document.getElementById('checkpoint-overlay').style.display = 'none';
}

// Initialize app on page load
window.addEventListener('DOMContentLoaded', () => {
    window.localsGoARApp = new LocalsGoARApp();
});
