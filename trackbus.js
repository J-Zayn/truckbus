document.addEventListener('DOMContentLoaded', () => {
    
    const firebaseConfig = {
        apiKey: "AIzaSyC5ZzXiOe8-Zad44M-AMRc8Yczb5nVurpU",
        authDomain: "onibusnaestrada-ad313.firebaseapp.com",
        databaseURL: "https://onibusnaestrada-ad313-default-rtdb.firebaseio.com",
        projectId: "onibusnaestrada-ad313",
        storageBucket: "onibusnaestrada-ad313.firebasestorage.app",
        messagingSenderId: "432204344739",
        appId: "1:432204344739:web:8b89dd476d59578fabbe16",
        measurementId: "G-LZFC78XWFW"
    };

    if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
    const database = firebase.database();

    const openMenuBtn = document.getElementById('open-menu');
    const closeMenuBtn = document.getElementById('close-menu');
    const sidebarMenu = document.getElementById('sidebar-menu');
    const menuOverlay = document.getElementById('menu-overlay');
    const openAuthBtn = document.getElementById('open-auth-menu');
    const authMenu = document.getElementById('auth-menu');

    const formBusca = document.getElementById('form-busca-estudante');
    const selectCidade = document.getElementById('select-cidade');
    const selectRota = document.getElementById('select-rota');
    const sectionResultados = document.getElementById('section-resultados');
    const badgeStatus = document.getElementById('rota-status-badge');
    const textoAviso = document.getElementById('rota-aviso-texto');
    const txtMotorista = document.getElementById('rota-motorista');
    const txtInicio = document.getElementById('rota-horario-inicio');
    const txtChegada = document.getElementById('rota-horario-chegada');
    const txtItinerario = document.getElementById('rota-itinerario');

    let mapa = null;
    let marcadorOnibus = null;
    let rotaAtivaRef = null;

    const alternarMenu = (abrir) => {
        if (abrir) {
            sidebarMenu.classList.add('active');
            menuOverlay.classList.add('active');
            authMenu.classList.remove('active');
        } else {
            sidebarMenu.classList.remove('active');
            menuOverlay.classList.remove('active');
        }
    };
    if(openMenuBtn) openMenuBtn.addEventListener('click', () => alternarMenu(true));
    if(closeMenuBtn) closeMenuBtn.addEventListener('click', () => alternarMenu(false));
    if(menuOverlay) menuOverlay.addEventListener('click', () => alternarMenu(false));

    if(openAuthBtn) {
        openAuthBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            authMenu.classList.toggle('active');
            sidebarMenu.classList.remove('active');
            menuOverlay.classList.remove('active');
        });
    }
    document.addEventListener('click', () => authMenu.classList.remove('active'));

    if(document.getElementById('menu-home')) document.getElementById('menu-home').addEventListener('click', (e) => { e.preventDefault(); alternarMenu(false); });
    if(document.getElementById('menu-sobre')) document.getElementById('menu-sobre').addEventListener('click', (e) => { e.preventDefault(); Swal.fire({ title: 'TrackBus v2.0', text: 'Desenvolvido por alunos do 3° Info P', icon: 'info', background: '#0A192F', color: 'white', confirmButtonColor: '#00B4D8' }); });
    if(document.getElementById('menu-avisos')) document.getElementById('menu-avisos').addEventListener('click', (e) => { e.preventDefault(); window.location.href = 'avisos.html'; });
    if(document.getElementById('menu-feedback')) document.getElementById('menu-feedback').addEventListener('click', (e) => { e.preventDefault(); window.location.href = 'feedback.html'; });
        
    document.querySelectorAll('.btn-login-motorista').forEach(botao => {
        botao.addEventListener('click', (e) => {
            e.preventDefault();
            authMenu.classList.remove('active');
            alternarMenu(false);

            // Intercepta aqui: Se já estiver logado, vai direto pro painel sem abrir o Swal
            const motoristaLogado = localStorage.getItem('trackbus_motorista_nome');
            if (motoristaLogado) {
                window.location.href = 'dashboard.html';
                return;
            }

            Swal.fire({
                title: 'Acesso do Motorista',
                html: `
                    <div style="text-align: left; margin-top: 10px;">
                        <label style="color: #8A99AD; font-size: 0.85rem; font-weight:600;">Nome Completo</label>
                        <input id="swal-motorista-nome" class="swal2-input" placeholder="Ex: João Silva" style="margin: 5px 0 15px 0; width: 100%; background: #020C1B; color: white; border: 1px solid #1E3A8A; border-radius: 8px;">
                        
                        <label style="color: #8A99AD; font-size: 0.85rem; font-weight:600;">Código Único / Matrícula</label>
                        <input id="swal-motorista-codigo" type="password" class="swal2-input" placeholder="Sua senha ou matrícula" style="margin: 5px 0 5px 0; width: 100%; background: #020C1B; color: white; border: 1px solid #1E3A8A; border-radius: 8px;">
                    </div>
                `,
                background: '#0A192F',
                color: 'white',
                showCancelButton: true,
                confirmButtonColor: '#00B4D8',
                cancelButtonColor: '#7f8c8d',
                confirmButtonText: 'Entrar',
                cancelButtonText: 'Cancelar',
                focusConfirm: false,
                preConfirm: () => {
                    const nome = document.getElementById('swal-motorista-nome').value;
                    const codigo = document.getElementById('swal-motorista-codigo').value;
                    if (!nome || !codigo) {
                        Swal.showValidationMessage('Por favor, preencha todos os campos!');
                    }
                    return { nome: nome, codigo: codigo };
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    const nomeDigitado = result.value.nome.trim().toLowerCase();
                    const codigoDigitado = result.value.codigo.trim();

                    database.ref('motoristas').once('value').then((snapshot) => {
                        let loginSucesso = false;
                        let dadosMotorista = null;
                        let idMotorista = "";

                        if (snapshot.exists()) {
                            snapshot.forEach((childSnap) => {
                                const chaveBanco = childSnap.key;
                                const dadosBanco = childSnap.val();
                                const nomeBanco = (dadosBanco.nome || "").trim().toLowerCase();
                                const matriculaBanco = (dadosBanco.matricula || "").toString().trim();

                                if (nomeBanco === nomeDigitado && matriculaBanco === codigoDigitado) {
                                    loginSucesso = true;
                                    dadosMotorista = dadosBanco;
                                    idMotorista = chaveBanco;
                                }
                            });
                        }

                        if (loginSucesso) {
                            localStorage.setItem('trackbus_user_tipo', 'motorista');
                            localStorage.setItem('trackbus_motorista_id', idMotorista);
                            localStorage.setItem('trackbus_motorista_nome', dadosMotorista.nome);
                            
                            Swal.fire({
                                title: 'Acesso Autorizado!',
                                text: `Seja bem-vindo, ${dadosMotorista.nome}!`,
                                icon: 'success',
                                background: '#0A192F',
                                color: 'white',
                                timer: 1500,
                                showConfirmButton: false
                            }).then(() => {
                                window.location.href = 'dashboard.html';
                            });
                        } else {
                            Swal.fire({ title: 'Erro de Acesso', text: 'Nome ou Código Único não conferem.', icon: 'error', background: '#0A192F', color: 'white', confirmButtonColor: '#00B4D8' });
                        }
                    });
                }
            });
        });
    });

    document.querySelectorAll('.btn-login-secretaria').forEach(botao => {
        botao.addEventListener('click', (e) => {
            e.preventDefault();
            authMenu.classList.remove('active');
            alternarMenu(false);

            Swal.fire({
                title: 'Painel de Gestão',
                text: 'Informe o código exclusivo da Secretaria:',
                input: 'password',
                inputPlaceholder: 'Digite o código de acesso...',
                background: '#0A192F',
                color: 'white',
                showCancelButton: true,
                confirmButtonColor: '#00B4D8',
                cancelButtonColor: '#7f8c8d',
                confirmButtonText: 'Verificar',
                cancelButtonText: 'Cancelar',
                inputAttributes: { autocapitalize: 'off', autocorrect: 'off' },
                inputValidator: (value) => {
                    if (!value) { return 'Você precisa digitar o código!'; }
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    const codigoDigitado = result.value.trim();

                    database.ref('usuarios/secretaria/codigo').once('value').then((snapshot) => {
                        let codigoMestre = "ECITDM26";
                        if (snapshot.exists()) {
                            codigoMestre = snapshot.val().toString().trim();
                        }

                        if (codigoDigitado === codigoMestre) {
                            localStorage.setItem('trackbus_user_tipo', 'secretaria');

                            Swal.fire({
                                title: 'Acesso Concedido',
                                text: 'Redirecionando para a central de gerenciamento...',
                                icon: 'success',
                                background: '#0A192F',
                                color: 'white',
                                timer: 1500,
                                showConfirmButton: false
                            }).then(() => {
                                window.location.href = 'gestao.html';
                            });
                        } else {
                            Swal.fire({ title: 'Acesso Recusado', text: 'Código de verificação inválido.', icon: 'error', background: '#0A192F', color: 'white', confirmButtonColor: '#00B4D8' });
                        }
                    });
                }
            });
        });
    });
    
    if (selectCidade) {
        database.ref('sedes').on('value', (snapshot) => {
            selectCidade.innerHTML = '<option value="" disabled selected>Escolha sua cidade...</option>';
            if (snapshot.exists()) {
                snapshot.forEach((childSnap) => {
                    const dados = childSnap.val();
                    const option = document.createElement('option');
                    option.value = dados.nome;
                    option.textContent = dados.nome;
                    selectCidade.appendChild(option);
                });
            } else {
                selectCidade.innerHTML = '<option value="">Nenhuma cidade disponível</option>';
            }
        });

        selectCidade.addEventListener('change', (e) => {
            const sedeEscolhida = e.target.value;

            if (!sedeEscolhida) {
                selectRota.innerHTML = '<option value="" disabled selected>Selecione a cidade primeiro...</option>';
                selectRota.disabled = true;
                return;
            }

            database.ref('rotas').on('value', (snapshot) => {
                selectRota.innerHTML = '<option value="" disabled selected>Escolha a sua rota...</option>';
                let encontrouRota = false;

                if (snapshot.exists()) {
                    snapshot.forEach((childSnap) => {
                        const dados = childSnap.val();
                        if (dados.sede === sedeEscolhida) {
                            const option = document.createElement('option');
                            option.value = childSnap.key;
                            option.textContent = dados.nome;
                            selectRota.appendChild(option);
                            encontrouRota = true;
                        }
                    });
                }

                if (encontrouRota) {
                    selectRota.disabled = false;
                } else {
                    selectRota.innerHTML = '<option value="">Nenhuma rota cadastrada</option>';
                    selectRota.disabled = true;
                }
            });
        });
    }

    if (formBusca) {
        formBusca.addEventListener('submit', (e) => {
            e.preventDefault();
            const cidade = selectCidade.value;
            const rota = selectRota.value;

            if (!cidade || !rota) return;
            if (rotaAtivaRef) rotaAtivaRef.off();

            sectionResultados.style.display = 'block';
            sectionResultados.scrollIntoView({ behavior: 'smooth' });

            rotaAtivaRef = database.ref(`rotas/${rota}`);
            rotaAtivaRef.on('value', (snapshot) => {
                if (!snapshot.exists()) return;
                const dados = snapshot.val();

                txtMotorista.innerText = dados.motorista || "Não alocado";
                txtInicio.innerText = dados.inicio || "--:--";
                txtChegada.innerText = dados.chegada || "--:--";
                txtItinerario.innerText = dados.itinerario || "Pontos não informados.";

                if (dados.motivo && dados.motivo !== "Viagem não iniciada") {
                    textoAviso.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${dados.motivo}`;
                } else {
                    textoAviso.innerHTML = `<i class="fa-solid fa-circle-check"></i> Sem ocorrências no trajeto.`;
                }

                badgeStatus.innerText = dados.status || "Fora de Operação";
                badgeStatus.className = "status-indicator";
                if (dados.status === "Em Rota") badgeStatus.classList.add('status-operacao');
                if (dados.status === "Atrasado") badgeStatus.classList.add('status-atrasado');

                let lat = dados.latitude || -6.8522; 
                let lng = dados.longitude || -35.4908;

                if (!mapa) {
                    mapa = L.map('mapa-estudante', { zoomControl: false }).setView([lat, lng], 15);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapa);
                    marcadorOnibus = L.marker([lat, lng]).addTo(mapa).bindPopup(`<b>${dados.motorista || 'Ônibus'}</b>`).openPopup();
                } else {
                    const novasCoordenadas = new L.LatLng(lat, lng);
                    marcadorOnibus.setLatLng(novasCoordenadas);
                    mapa.panTo(novasCoordenadas);
                }
            });
        });
    }

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    }

});