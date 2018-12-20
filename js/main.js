let tick = null;
let snowSet = null;

(() => {
    onload = () => {
        tick = 0;
        snowSet = [];

        const load = document.getElementById('load');

        const resize = () => {
            source.onResizeElement();
            source.copyElementSizeTo(renderer.domElement);
            if (context.arController !== null) source.copyElementSizeTo(context.arController.canvas);
        }

        const scene = new THREE.Scene();
        const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
        renderer.setClearColor(new THREE.Color('black'), 0);
        renderer.setSize(640, 480);

        renderer.domElement.style = 'position: absolute; left: 0; top: 0;';
        document.body.appendChild(renderer.domElement);

        const camera = new THREE.Camera();
        scene.add(camera);

        // const sun = new THREE.DirectionalLight(0xfff4f4, 3.7);
        const sun = new THREE.HemisphereLight(0x0000ff, 0x00ff00, 1.5);
        sun.position.set(0, 0, 2);
        scene.add(sun);

        const pointLight = new THREE.PointLight(0xb8e0ef, 8, 40);
        pointLight.position.set(0.2, 0.7, 2);
        scene.add(pointLight);

        const source = new THREEx.ArToolkitSource({sourceType: 'webcam'});
        source.init(() => resize());

        const context = new THREEx.ArToolkitContext({
            detectionMode: 'mono',
            imageSmoothingEnabled: true,
            cameraParametersUrl: './ar/camera_para.dat',
            canvasHeight: source.parameters.sourceHeight,
            canvasWidth: source.parameters.sourceWidth,
            maxDetectionRate: 60
        });

        context.init(() => camera.projectionMatrix.copy(context.getProjectionMatrix()));
        window.addEventListener('resize', () => resize());

        const marker = new THREE.Group();
        const controls = new THREEx.ArMarkerControls(context, marker, {type: 'pattern', preset: 'custom', patternUrl: `./ar/marker.patt`});
        scene.add(marker);

        // load ground object
        let loader = new THREE.GLTFLoader();
        loader.load('./ar/model/ground.glb', data => {
            let size = 0.2;
            let object = data.scene;
            object.scale.set(size, size, size);
            object.position.set(0, 0, 0);
            marker.add(object);
        });

        // load house object
        loader = new THREE.GLTFLoader();
        loader.load('./ar/model/house.glb', data => {
            let size = 0.18;
            let object = data.scene;
            object.scale.set(size, size, size);
            object.position.set(0.1, 0.5, -0.2);
            marker.add(object);
        });

        // load stone object
        for (let i = 0; i < 3; i++) {
            loader = new THREE.GLTFLoader();
            loader.load('./ar/model/stone.glb', data => {
                let size = 0.12;
                let object = data.scene;
                object.scale.set(size, size, size);
                object.position.set(-0.1, 0.1, 0.64 + i / 2.6);
                object.rotation.y = i * 60 * Math.PI / 180;
                marker.add(object);
            });
        }

        // load present box
        [{x: 0.3, y: 0.2, z: 0.7, d: 70}, {x: 0.5, y: 0.2, z: 0.67, d: 120}, {x: 0.4, y: 0.4, z: 0.71, d: 40}].map(param => {
            loader = new THREE.GLTFLoader();
            loader.load('./ar/model/presentBox.glb', data => {
                let size = 0.04;
                let object = data.scene;
                object.scale.set(size, size, size);
                object.position.set(param.x, param.y, param.z);
                object.rotation.set(0, param.d * Math.PI / 180, 0);
                marker.add(object);
            });
        });

        // load tree object
        [{x: 1.2, y: 0, z: -0.2}, {x: -0.9, y: 0, z: 0.8}].map((pos, index) => {
            let loader = new THREE.GLTFLoader();
            loader.load('./ar/model/tree.glb', data => {
                let size = 0.14;
                let object = data.scene;
                object.scale.set(size, size, size);
                object.position.set(pos.x, pos.y, pos.z);
                marker.add(object);

                if (index === 1) object.rotation.set(0, 180 * Math.PI / 180, 0);
            });
        });

        const videoTexture = new THREE.VideoTexture(source.domElement);
        videoTexture.minFilter = THREE.NearestFilter;

        const cloak = new THREEx.ArMarkerCloak(videoTexture);
        cloak.object3d.material.uniforms.opacity.value = 1.0;
        marker.add(cloak.object3d);

        // start
        const main = () => {
            requestAnimationFrame(main);

            load.style.display = source.ready ? 'none' : 'block';
            if (source.ready === false) return;

            if (Math.random() <= 0.15) {
                let area = 1.4;
                let snow = new THREE.Mesh(new THREE.SphereGeometry(0.012, 64, 64), new THREE.MeshPhongMaterial({color: 0xfbfbfb}));
                let x = -area + Math.random() * (area * 2);
                let z = -area + Math.random() * (area * 2);

                snow.position.set(x, 3, z);
                snowSet.push({snow, x, z, tick: (Math.random() * 90) >> 0});
                marker.add(snow);
            }

            context.update(source.domElement);
            renderer.render(scene, camera);

            snowSet.map((target, index) => {
                target.snow.position.y += -0.01;
                target.snow.position.x = target.x + Math.cos(target.tick * Math.PI / 180) * 0.1;
                target.snow.position.z = target.z + Math.cos(target.tick * Math.PI / 180) * 0.1;
                target.tick++;

                if (target.snow.position.y < 0.1) {
                    marker.remove(target.snow);
                    snowSet.splice(index, 1);
                }
            });

            tick++;
        }

        main();
    }
})();