import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, ArrowRight, CheckCircle, Code, Zap, Cpu, MessageSquare, Users, Star, X } from 'lucide-react';

// Helper component for Icons
const IconWrapper = ({ children }) => <div className="bg-blue-500/10 text-blue-400 p-3 rounded-lg">{children}</div>;

// --- 3D Starfield Background Component (for Home page) ---
const ParticleBackground = () => {
    const mountRef = useRef(null);
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        script.async = true;
        document.body.appendChild(script);
        script.onload = () => {
            const THREE = window.THREE;
            let scene, camera, renderer, particles;
            let mouse = new THREE.Vector2(-100, -100);
            const mount = mountRef.current;
            let animationFrameId;
            let targetCameraZ = 200;

            const init = () => {
                scene = new THREE.Scene();
                scene.fog = new THREE.FogExp2(0x0A0A0A, 0.0015);
                camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
                camera.position.z = targetCameraZ;
                renderer = new THREE.WebGLRenderer({ antialias: true });
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.setClearColor(0x0A0A0A, 1);
                if(mount) mount.appendChild(renderer.domElement);

                const particleCount = 15000;
                const positions = new Float32Array(particleCount * 3);
                const colors = new Float32Array(particleCount * 3);
                const color = new THREE.Color();
                const boxSize = 800;

                for (let i = 0; i < particleCount; i++) {
                    positions[i * 3] = (Math.random() - 0.5) * boxSize;
                    positions[i * 3 + 1] = (Math.random() - 0.5) * boxSize;
                    positions[i * 3 + 2] = (Math.random() - 0.5) * (boxSize * 2.5);
                    const randomColor = Math.random();
                    if (randomColor < 0.33) color.set(0x00BFFF);
                    else if (randomColor < 0.66) color.set(0x8A2BE2);
                    else color.set(0x00FFFF);
                    colors[i * 3] = color.r;
                    colors[i * 3 + 1] = color.g;
                    colors[i * 3 + 2] = color.b;
                }

                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
                const material = new THREE.PointsMaterial({ size: 1.2, vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false });
                particles = new THREE.Points(geometry, material);
                scene.add(particles);

                window.addEventListener('resize', onWindowResize);
                document.addEventListener('mousemove', onMouseMove);
                window.addEventListener('scroll', onScroll);
            };

            const animate = () => {
                animationFrameId = requestAnimationFrame(animate);
                render();
            };

            const render = () => {
                camera.position.z += (targetCameraZ - camera.position.z) * 0.05;
                const targetRotationX = -mouse.y * 0.1;
                const targetRotationY = -mouse.x * 0.1;
                particles.rotation.x += (targetRotationX - particles.rotation.x) * 0.05;
                particles.rotation.y += (targetRotationY - particles.rotation.y) * 0.05;
                renderer.render(scene, camera);
            };

            const onWindowResize = () => {
                if (!camera || !renderer) return;
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            };

            const onMouseMove = (event) => {
                mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            };

            const onScroll = () => {
                const scrollableHeight = document.body.scrollHeight - window.innerHeight;
                if (scrollableHeight <= 0) return;
                const scrollPercent = window.scrollY / scrollableHeight;
                targetCameraZ = 200 - (isNaN(scrollPercent) ? 0 : scrollPercent) * 1200;
            };

            init();
            animate();
            
            return () => {
                cancelAnimationFrame(animationFrameId);
                window.removeEventListener('resize', onWindowResize);
                document.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('scroll', onScroll);
                if (mount && renderer.domElement) mount.removeChild(renderer.domElement);
            };
        };
        return () => { if (script.parentNode) document.body.removeChild(script); };
    }, []);
    return <div ref={mountRef} className="fixed top-0 left-0 w-full h-full -z-10" />;
};

// --- Generative/Shader Background Component (for other pages) ---
const ShaderBackground = ({ type }) => {
    const mountRef = useRef(null);

    useEffect(() => {
        const THREE = window.THREE;
        if (!THREE) return;

        let scene, camera, renderer, plane;
        let mouse = new THREE.Vector2(-100, -100);
        const mount = mountRef.current;
        let animationFrameId;

        const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShaders = {
            services: ` // Metaballs / Lava Lamp (Darker)
                varying vec2 vUv;
                uniform float u_time;
                uniform vec2 u_mouse;

                void main() {
                    vec2 st = vUv;
                    st.x *= (16.0/9.0); // Aspect ratio correction

                    float d = 0.0;
                    
                    vec2 mouse_pos = u_mouse;
                    mouse_pos.x *= (16.0/9.0);
                    d += 0.12 / distance(st, mouse_pos);

                    d += 0.12 / distance(st, vec2(0.5 + sin(u_time * 0.5) * 0.3, 0.5 + cos(u_time * 0.3) * 0.3));
                    d += 0.12 / distance(st, vec2(1.5 + sin(u_time * 0.3) * 0.5, 0.5 + cos(u_time * 0.5) * 0.5));
                    d += 0.12 / distance(st, vec2(1.0 + sin(u_time * 0.2) * 0.7, 1.0 + cos(u_time * 0.7) * 0.2));

                    d = smoothstep(0.8, 1.0, d);
                    
                    vec3 color1 = vec3(0.02, 0.03, 0.07);
                    vec3 color2 = vec3(0.05, 0.2, 0.5);
                    vec3 color3 = vec3(0.2, 0.5, 0.7);
                    
                    vec3 color = mix(color1, color2, d);
                    color = mix(color, color3, smoothstep(0.9, 1.0, d));

                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            tarifs: ` // Interactive Digital Grid (Darker)
                varying vec2 vUv;
                uniform float u_time;
                uniform vec2 u_mouse;

                void main() {
                    vec2 st = vUv;
                    st *= 30.0;
                    
                    vec2 ipos = floor(st);
                    vec2 fpos = fract(st);

                    vec3 color = vec3(0.03, 0.0, 0.06);

                    float mouse_dist = distance(st, u_mouse * 30.0);
                    float glow = 1.5 / (mouse_dist * mouse_dist + 1.0);
                    
                    float point_size = 0.08 + glow * 0.2;
                    if (length(fpos - 0.5) < point_size) {
                        vec3 point_color = vec3(0.6, 0.3, 0.8);
                        color = mix(color, point_color, 1.0 - smoothstep(0.0, point_size, length(fpos - 0.5)));
                    }
                    
                    float pulse = sin(ipos.x * 0.5 + u_time) + cos(ipos.y * 0.5 + u_time);
                    if (abs(fpos.x - 0.5) < 0.01 || abs(fpos.y - 0.5) < 0.01) {
                        color += vec3(0.4, 0.15, 0.6) * (0.05 + glow * 0.2) * (0.5 + sin(pulse) * 0.5);
                    }

                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            contact: ` // Cosmic Ink / Smoke (Darker)
                varying vec2 vUv;
                uniform float u_time;
                uniform vec2 u_mouse;

                float random (vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898,78.233)))* 43758.5453123); }
                float noise (vec2 st) {
                    vec2 i = floor(st); vec2 f = fract(st);
                    float a = random(i); float b = random(i + vec2(1.0, 0.0));
                    float c = random(i + vec2(0.0, 1.0)); float d = random(i + vec2(1.0, 1.0));
                    vec2 u = f*f*(3.0-2.0*f);
                    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
                }
                mat2 rotate(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }
                float fbm(vec2 st) {
                    float v = 0.0; float a = 0.5;
                    for (int i = 0; i < 5; ++i) {
                        v += a * noise(st);
                        st = rotate(1.5) * st * 2.0; a *= 0.5;
                    }
                    return v;
                }

                void main() {
                    vec2 st = vUv;
                    st *= 2.0;
                    
                    float mouse_dist = distance(st, u_mouse * 2.0);
                    float turbulence = 1.0 / (mouse_dist * 5.0 + 1.0);
                    
                    vec2 q = vec2(fbm(st + u_time * 0.1), fbm(st + vec2(5.2,1.3) + u_time * 0.1));
                    vec2 r = vec2(fbm(st + q * 2.0 + vec2(1.7,9.2) + u_time * 0.2 + turbulence * 0.2),
                                  fbm(st + q * 2.0 + vec2(8.3,2.8) + u_time * 0.2 + turbulence * 0.2));

                    float n = fbm(st + r);

                    vec3 color1 = vec3(0.05, 0.0, 0.1);
                    vec3 color2 = vec3(0.3, 0.05, 0.4);
                    vec3 color3 = vec3(0.6, 0.3, 0.5);
                    
                    vec3 color = mix(color1, color2, smoothstep(0.2, 0.5, n));
                    color = mix(color, color3, smoothstep(0.5, 0.7, n));
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `
        };

        const init = () => {
            scene = new THREE.Scene();
            camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            if(mount) mount.appendChild(renderer.domElement);

            const geometry = new THREE.PlaneGeometry(2, 2);
            const material = new THREE.ShaderMaterial({
                vertexShader,
                fragmentShader: fragmentShaders[type],
                uniforms: {
                    u_time: { value: 0.0 },
                    u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
                },
            });
            plane = new THREE.Mesh(geometry, material);
            scene.add(plane);

            window.addEventListener('resize', onWindowResize);
            document.addEventListener('mousemove', onMouseMove);
        };

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            plane.material.uniforms.u_time.value += 0.01;
            renderer.render(scene, camera);
        };

        const onWindowResize = () => { renderer.setSize(window.innerWidth, window.innerHeight); };
        const onMouseMove = (event) => {
            mouse.x = event.clientX / window.innerWidth;
            mouse.y = 1.0 - (event.clientY / window.innerHeight);
            plane.material.uniforms.u_mouse.value = mouse;
        };

        init();
        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', onWindowResize);
            document.removeEventListener('mousemove', onMouseMove);
            if (mount && renderer.domElement) mount.removeChild(renderer.domElement);
        };
    }, [type]);

    return <div ref={mountRef} className="fixed top-0 left-0 w-full h-full -z-10 bg-[#0A0A0A]" />;
};


// --- Main App Component ---
const App = () => {
    const [currentPage, setCurrentPage] = useState('home');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const tailwindScript = document.createElement('script');
        tailwindScript.src = "https://cdn.tailwindcss.com";
        document.head.appendChild(tailwindScript);

        const gtmScript = document.createElement("script");
        gtmScript.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-TL3NZSML');`;
        document.head.appendChild(gtmScript);

        const fontLink1 = document.createElement('link');
        fontLink1.href = "https://fonts.googleapis.com";
        fontLink1.rel = "preconnect";
        document.head.appendChild(fontLink1);

        const fontLink2 = document.createElement('link');
        fontLink2.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap";
        fontLink2.rel = "stylesheet";
        document.head.appendChild(fontLink2);


        return () => { 
            if (gtmScript.parentNode) document.head.removeChild(gtmScript);
            if (tailwindScript.parentNode) document.head.removeChild(tailwindScript);
            if (fontLink1.parentNode) document.head.removeChild(fontLink1);
            if (fontLink2.parentNode) document.head.removeChild(fontLink2);
        }
    }, []);

    const navigateTo = (page) => {
        setCurrentPage(page);
        setIsMenuOpen(false);
        window.scrollTo(0, 0);
    };

    const PageContent = () => {
        switch (currentPage) {
            case 'services': return <ServicesPage navigateTo={navigateTo} />;
            case 'tarifs': return <TarifsPage navigateTo={navigateTo} />;
            case 'contact': return <ContactPage navigateTo={navigateTo} />;
            default: return <HomePage navigateTo={navigateTo} />;
        }
    };

    const BackgroundSelector = () => (
        <AnimatePresence>
            {currentPage === 'home' && (
                <motion.div key="home-bg" exit={{ opacity: 0 }} transition={{ duration: 1 }}>
                    <ParticleBackground />
                </motion.div>
            )}
            {['services', 'tarifs', 'contact'].includes(currentPage) && (
                 <motion.div key={`${currentPage}-bg`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }}>
                    <ShaderBackground type={currentPage} />
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <>
            <noscript>
                <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TL3NZSML" height="0" width="0" style={{ display: 'none', visibility: 'hidden' }}></iframe>
            </noscript>
            <div className="text-gray-200 font-['Inter',_sans-serif] antialiased">
                <BackgroundSelector />
                <div className="relative z-10">
                    <Header navigateTo={navigateTo} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
                    <main className="px-4 sm:px-6 lg:px-8">
                        <AnimatePresence mode="wait">
                            <motion.div key={currentPage} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
                                <PageContent />
                            </motion.div>
                        </AnimatePresence>
                    </main>
                    <Footer />
                </div>
                <style>{`
                    body { 
                        background-color: #0A0A0A; 
                    }
                    /* Add a safe area at the bottom on mobile to prevent the browser UI from hiding fixed elements */
                    @media (max-width: 768px) {
                        body {
                            padding-bottom: 80px;
                        }
                    }
                `}</style>
            </div>
        </>
    );
};

// --- Header Component ---
const Header = ({ navigateTo, isMenuOpen, setIsMenuOpen }) => {
    const navLinks = [
        { name: 'Accueil', page: 'home' },
        { name: 'Nos Services', page: 'services' },
        { name: 'Tarifs', page: 'tarifs' },
        { name: 'Contact', page: 'contact' },
    ];

    return (
        <header className="sticky top-0 z-50">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl px-6 py-3 flex justify-between items-center">
                    <button onClick={() => navigateTo('home')} className="text-2xl font-bold text-white flex items-center gap-2">
                        <Cpu className="text-blue-400"/> Chatbot IA
                    </button>
                    <div className="hidden lg:flex items-center space-x-6">
                        {navLinks.map(link => (
                            <button key={link.page} onClick={() => navigateTo(link.page)} className="text-gray-300 hover:text-white transition-colors duration-300">
                                {link.name}
                            </button>
                        ))}
                    </div>
                    <div className="lg:hidden">
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white">
                            {isMenuOpen ? <X size={28} /> : <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>}
                        </button>
                    </div>
                </div>
                 {isMenuOpen && (
                    <div className="lg:hidden mt-2 bg-black/50 backdrop-blur-lg border border-white/10 rounded-xl p-4">
                        <div className="flex flex-col space-y-4">
                            {navLinks.map(link => (
                                <button key={link.page} onClick={() => navigateTo(link.page)} className="text-gray-300 hover:text-white transition-colors duration-300 text-left py-2">
                                    {link.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
};

// --- Page Components ---

const Section = ({ children, className = '' }) => (
    <motion.section 
        className={`py-20 sm:py-24 ${className}`}
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8 }}
    >
        <div className="container mx-auto">{children}</div>
    </motion.section>
);

const HomePage = ({ navigateTo }) => (
    <>
        {/* Hero Section */}
        <div className="text-center pt-24 pb-32">
            <motion.div 
                initial={{ opacity: 0, y: -30 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.8 }}
                className="max-w-4xl mx-auto"
            >
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight">
                    Votre réceptionniste <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">ne dort jamais.</span>
                </h1>
                <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-gray-400">
                    Transformez les visiteurs de votre site en clients, 24h/24, grâce à un assistant IA conçu en Suisse.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
                    <button onClick={() => navigateTo('tarifs')} className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105">
                        Voir nos offres
                    </button>
                    <div className="w-full sm:w-auto bg-white/10 border border-white/20 text-white font-bold px-8 py-4 rounded-xl">
                        Testez-le en direct en bas à droite →
                    </div>
                </div>
            </motion.div>
        </div>

        {/* Problem Section */}
        <Section>
            <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-bold text-white">Vous manquez des clients sans même le savoir.</h2>
                <p className="mt-4 text-lg text-gray-400">
                    Plus de 60% des visiteurs quittent un site web s'ils ne trouvent pas une réponse immédiate à leur question. Chaque visiteur perdu est une opportunité manquée.
                </p>
            </div>
        </Section>

        {/* Solution Section */}
        <Section>
            <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold text-white">Un assistant qui travaille pour vous.</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center transform hover:-translate-y-2 transition-transform duration-300">
                    <IconWrapper><Zap size={28} /></IconWrapper>
                    <h3 className="mt-6 text-xl font-bold text-white">Réponses Instantanées 24/7</h3>
                    <p className="mt-2 text-gray-400">Libérez-vous du temps, l'IA répond aux questions sur vos horaires, tarifs et services.</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center transform hover:-translate-y-2 transition-transform duration-300">
                    <IconWrapper><Users size={28} /></IconWrapper>
                    <h3 className="mt-6 text-xl font-bold text-white">Ne Perdez Plus un Client</h3>
                    <p className="mt-2 text-gray-400">Capturez l'intérêt des visiteurs et guidez-les vers une prise de contact ou un achat.</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center transform hover:-translate-y-2 transition-transform duration-300">
                    <IconWrapper><Star size={28} /></IconWrapper>
                    <h3 className="mt-6 text-xl font-bold text-white">Une Image Moderne</h3>
                    <p className="mt-2 text-gray-400">Montrez que votre entreprise est à la pointe de la technologie.</p>
                </div>
            </div>
        </Section>

        {/* How it works Section */}
        <Section>
            <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold text-white">Comment ça marche ?</h2>
            </div>
            <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8 text-center relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 hidden md:block">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
                </div>
                <div className="relative bg-transparent p-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <div className="text-blue-400 font-bold text-2xl mb-4">1</div>
                        <h3 className="text-xl font-semibold text-white">Prise de contact</h3>
                        <p className="mt-2 text-gray-400">Nous discutons de vos besoins pour comprendre votre entreprise.</p>
                    </div>
                </div>
                <div className="relative bg-transparent p-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <div className="text-blue-400 font-bold text-2xl mb-4">2</div>
                        <h3 className="text-xl font-semibold text-white">Personnalisation</h3>
                        <p className="mt-2 text-gray-400">Nous formons l'IA avec vos données pour des réponses parfaites.</p>
                    </div>
                </div>
                <div className="relative bg-transparent p-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <div className="text-blue-400 font-bold text-2xl mb-4">3</div>
                        <h3 className="text-xl font-semibold text-white">Installation simple</h3>
                        <p className="mt-2 text-gray-400">Nous intégrons le chatbot sur votre site en quelques minutes.</p>
                    </div>
                </div>
            </div>
        </Section>

        {/* Final CTA Section */}
        <Section className="text-center">
            <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
                    Prêt à transformer votre entreprise ?
                </h2>
                <p className="mt-6 text-lg text-gray-400">
                    Ne laissez plus un seul client potentiel vous échapper. Installez un assistant IA dès aujourd'hui.
                </p>
                <button 
                    onClick={() => navigateTo('tarifs')} 
                    className="mt-10 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-10 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 text-lg"
                >
                    Découvrir nos offres
                </button>
            </div>
        </Section>
    </>
);

const ServicesPage = ({ navigateTo }) => (
    <div className="py-24">
        <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white">Nos Services</h1>
            <p className="mt-4 text-lg text-gray-400">Des solutions adaptées à vos besoins, de la simple information à l'automatisation complète.</p>
        </div>

        <div className="mt-20 max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col">
                <IconWrapper><MessageSquare size={32} /></IconWrapper>
                <h2 className="text-3xl font-bold text-white mt-6">Assistant Informatif</h2>
                <p className="text-gray-400 mt-4 flex-grow">L'offre de base pour répondre aux questions fréquentes de vos clients, 24/7. Idéal pour présenter vos services, horaires, tarifs et guider les visiteurs vers une prise de contact efficace. Libérez votre temps et ne manquez plus jamais une question.</p>
                <button onClick={() => navigateTo('tarifs')} className="mt-8 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 w-full sm:w-auto">
                    Commander cette offre
                </button>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col">
                <IconWrapper><Zap size={32} /></IconWrapper>
                <h2 className="text-3xl font-bold text-white mt-6">Automatisation Avancée</h2>
                <p className="text-gray-400 mt-4 flex-grow">Passez à la vitesse supérieure. Connectez votre chatbot à vos outils existants : agendas pour la prise de rendez-vous, stocks pour des informations en temps réel, envoi de rappels par SMS, et bien plus. Une solution sur-mesure pour automatiser vos processus métier.</p>
                <button onClick={() => navigateTo('contact')} className="mt-8 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 w-full sm:w-auto">
                    Prendre un rendez-vous
                </button>
            </div>
        </div>
    </div>
);

const TarifsPage = ({ navigateTo }) => {
    const faqItems = [
        { q: "Quels sont les coûts de l'API ?", a: "Les coûts de l'API sont inclus dans nos abonnements jusqu'à un certain volume de messages. Pour un trafic très élevé, un ajustement peut être discuté." },
        { q: "La maintenance est-elle incluse ?", a: "Oui, la maintenance technique et les mises à jour du chatbot sont incluses dans l'abonnement mensuel pour garantir un fonctionnement optimal." },
        { q: "Puis-je changer d'offre plus tard ?", a: "Absolument. Vous pouvez passer de l'offre 'Assistant Informatif' à une solution d'automatisation avancée à tout moment." },
    ];

    return (
        <div className="py-24">
            <div className="text-center max-w-3xl mx-auto">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-white">Tarifs</h1>
                <p className="mt-4 text-lg text-gray-400">Une tarification simple et transparente pour lancer votre assistant IA.</p>
            </div>

            <div className="mt-20 max-w-4xl mx-auto grid lg:grid-cols-2 gap-8 items-stretch">
                {/* Plan 1 */}
                <div className="bg-white/5 border-2 border-blue-500 rounded-2xl p-8 flex flex-col shadow-2xl shadow-blue-500/10">
                    <h2 className="text-2xl font-bold text-blue-400">Assistant Informatif</h2>
                    <div className="my-6">
                        <span className="text-5xl font-extrabold text-white">49</span>
                        <span className="text-lg text-gray-400">CHF/mois</span>
                    </div>
                    <p className="text-gray-400">Frais d'installation uniques : 250 CHF</p>
                    <ul className="mt-8 space-y-4 text-gray-300 flex-grow">
                        <li className="flex items-center gap-3"><CheckCircle className="text-green-400" size={20} /> Réponses aux questions fréquentes</li>
                        <li className="flex items-center gap-3"><CheckCircle className="text-green-400" size={20} /> Guide vers la prise de contact</li>
                        <li className="flex items-center gap-3"><CheckCircle className="text-green-400" size={20} /> Formation sur vos données</li>
                        <li className="flex items-center gap-3"><CheckCircle className="text-green-400" size={20} /> Installation sur votre site</li>
                    </ul>
                    <a href="https://zenithtechdesign.github.io/chatbot-ia-commande" className="block text-center mt-10 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition-all duration-300">
                        Commander
                    </a>
                </div>
                {/* Plan 2 */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col">
                    <h2 className="text-2xl font-bold text-cyan-400">Automatisation Avancée</h2>
                    <div className="my-6">
                        <span className="text-5xl font-extrabold text-white">Sur devis</span>
                    </div>
                    <p className="text-gray-400">Une solution entièrement sur-mesure.</p>
                    <ul className="mt-8 space-y-4 text-gray-300 flex-grow">
                        <li className="flex items-center gap-3"><CheckCircle className="text-green-400" size={20} /> Toutes les fonctions de base</li>
                        <li className="flex items-center gap-3"><CheckCircle className="text-green-400" size={20} /> Connexion aux agendas (Calendly, etc.)</li>
                        <li className="flex items-center gap-3"><CheckCircle className="text-green-400" size={20} /> Connexion aux stocks de produits</li>
                        <li className="flex items-center gap-3"><CheckCircle className="text-green-400" size={20} /> Envoi de rappels SMS/Email</li>
                        <li className="flex items-center gap-3"><CheckCircle className="text-green-400" size={20} /> Workflows personnalisés</li>
                    </ul>
                    <button onClick={() => navigateTo('contact')} className="mt-10 w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 rounded-lg transition-all duration-300">
                        Prendre rendez-vous
                    </button>
                </div>
            </div>

            {/* FAQ */}
            <div className="mt-24 max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-center text-white">Questions fréquentes</h2>
                <div className="mt-8 space-y-4">
                    {faqItems.map((item, index) => (
                        <details key={index} className="bg-white/5 border border-white/10 rounded-lg p-4 cursor-pointer group">
                            <summary className="font-semibold text-white flex justify-between items-center">
                                {item.q}
                                <ArrowRight className="transform transition-transform duration-300 group-open:rotate-90" size={20} />
                            </summary>
                            <p className="mt-2 text-gray-400">{item.a}</p>
                        </details>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ContactPage = ({ navigateTo }) => {
    // State for form fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    // State for submission status: 'idle', 'sending', 'success', 'error'
    const [status, setStatus] = useState('idle');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('sending');

        try {
            const response = await fetch('https://doc2ai.ch/webhook-test/53394872-b923-41a0-a7ac-6ba7d1e385a7', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, message }),
            });

            if (response.ok) {
                setStatus('success');
                // Reset form fields after successful submission
                setName('');
                setEmail('');
                setMessage('');
            } else {
                // Handle non-ok responses (e.g., 4xx, 5xx)
                console.error('Webhook response not OK:', response);
                setStatus('error');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setStatus('error');
        }
    };

    return (
        <div className="py-24">
            <div className="text-center max-w-3xl mx-auto">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-white">Contact</h1>
                <p className="mt-4 text-lg text-gray-400">Une question ? Un projet ? N'hésitez pas à nous contacter.</p>
            </div>

            <div className="mt-20 max-w-4xl mx-auto grid lg:grid-cols-2 gap-12">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                    {status === 'success' ? (
                        <div className="text-center flex flex-col items-center justify-center h-full">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}>
                                <CheckCircle className="text-green-400 w-16 h-16 mb-4" />
                            </motion.div>
                            <h2 className="text-2xl font-bold text-white">Message envoyé !</h2>
                            <p className="text-gray-400 mt-2">Nous avons bien reçu votre message et nous vous répondrons dans les plus brefs délais.</p>
                             <button onClick={() => setStatus('idle')} className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition-all duration-300">
                                Envoyer un autre message
                            </button>
                        </div>
                    ) : (
                        <AnimatePresence>
                            <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <h2 className="text-2xl font-bold text-white">Envoyer un message</h2>
                                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-300">Nom</label>
                                        <input 
                                            type="text" 
                                            id="name" 
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className="mt-2 w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
                                        <input 
                                            type="email" 
                                            id="email" 
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="mt-2 w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label htmlFor="message" className="block text-sm font-medium text-gray-300">Message</label>
                                        <textarea 
                                            id="message" 
                                            rows="4" 
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            required
                                            className="mt-2 w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                                    </div>
                                    <button 
                                        type="submit" 
                                        disabled={status === 'sending'}
                                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition-all duration-300 disabled:bg-blue-800 disabled:cursor-not-allowed flex items-center justify-center"
                                    >
                                        {status === 'sending' ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Envoi en cours...
                                            </>
                                        ) : 'Envoyer'}
                                    </button>
                                    {status === 'error' && (
                                        <p className="text-red-400 text-center">Une erreur s'est produite. Veuillez réessayer.</p>
                                    )}
                                </form>
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
                <div className="space-y-8">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                         <h3 className="text-xl font-semibold text-white">Informations de contact</h3>
                         <div className="mt-4 space-y-4">
                            <div className="flex items-center gap-4">
                                <Mail className="text-blue-400" size={24} />
                                <a href="mailto:contact@chatbot-ia.ch" className="text-gray-300 hover:text-white">contact@chatbot-ia.ch</a>
                            </div>
                            <div className="flex items-center gap-4">
                                <Phone className="text-blue-400" size={24} />
                                <a href="tel:+41791278371" className="text-gray-300 hover:text-white">+41 79 127 83 71</a>
                            </div>
                         </div>
                    </div>
                     <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                         <h3 className="text-xl font-semibold text-white">Projet d'automatisation ?</h3>
                         <p className="mt-2 text-gray-400">Pour les projets sur-mesure, utilisez notre formulaire de qualification pour un rendez-vous productif.</p>
                         <button onClick={() => navigateTo('contact')} className="mt-4 w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 rounded-lg transition-all duration-300">
                            Qualifier mon projet
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};




// --- Footer Component ---
const Footer = () => (
    <footer className="py-8 mt-16 border-t border-white/10">
        <div className="container mx-auto text-center text-gray-500">
            <p>&copy; {new Date().getFullYear()} Chatbot IA Suisse. Tous droits réservés.</p>
        </div>
    </footer>
);

export default App;
