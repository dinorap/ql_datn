import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';

const Product360View = ({ img_3d }) => {

    const BASE_URL = process.env.REACT_APP_BASE_URL || "";
    const modelPathFromDB = (img_3d || "").trim();
    const fullModelUrl = modelPathFromDB
        ? `${BASE_URL}${modelPathFromDB}`
        : "";

    const mountRef = useRef(null);

    useEffect(() => {
        if (!mountRef.current || !fullModelUrl) return undefined;

        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(45, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
        camera.position.set(0, 0, 2.5);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.5;
        mountRef.current.appendChild(renderer.domElement);

        // Không để lỗi fetch HDR làm crash runtime.
        const envLoader = new RGBELoader();
        envLoader.load(
            '/mirrored_hall_4k.hdr',
            (texture) => {
                texture.mapping = THREE.EquirectangularReflectionMapping;
                scene.environment = texture;
                scene.background = texture;
            },
            undefined,
            () => {
                const ambient = new THREE.AmbientLight(0xffffff, 1.1);
                const directional = new THREE.DirectionalLight(0xffffff, 1.2);
                directional.position.set(2, 2, 2);
                scene.add(ambient);
                scene.add(directional);
            }
        );


        const loader = new GLTFLoader();
        loader.load(
            fullModelUrl,
            (gltf) => {
                const model = gltf.scene;

                model.scale.set(5, 5, 5);
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                model.position.sub(center);
                model.rotation.y = Math.PI;

                scene.add(model);
            },
            undefined,
            (error) => {
                console.error("Không tải được model 3D:", error);
            }
        );

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        let animationId = null;
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            if (animationId) cancelAnimationFrame(animationId);
            controls.dispose();
            renderer.dispose();
            if (mountRef.current && renderer.domElement) {
                try {
                    mountRef.current.removeChild(renderer.domElement);
                } catch (e) {
                    console.warn("cleanup 3D failed:", e);
                }
            }
        };

    }, [fullModelUrl]);

    return <div ref={mountRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />;


};

export default Product360View;