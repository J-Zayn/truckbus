document.addEventListener('DOMContentLoaded', () => {

    const motoristaNome = localStorage.getItem('trackbus_motorista_nome');
    const motoristaId = localStorage.getItem('trackbus_motorista_id');

    if (!motoristaNome || !motoristaId) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('nome-motorista-header').innerText = motoristaNome;

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

    const controlesJornada = document.getElementById('controles-jornada');
    const statusBotoes = document.querySelectorAll('.btn-status-toggle');
    const incidentBotoes = document.querySelectorAll('.btn-incident');
    const btnToggleGps = document.getElementById('btn-toggle-gps');
    const gpsStatusText = document.getElementById('gps-status-text');
    const txtRotaAtribuida = document.getElementById('texto-rota-atribuida');

    let rotaAtiva = "";
    let gpsIntervalo = null;
    
    let latSimulada = -6.8522;
    let lngSimulada = -35.4908;

    database.ref('rotas').on('value', (snapshot) => {
        let rotaEncontrada = false;
        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                const dados = child.val();
                if (dados.motorista === motoristaNome) {
                    rotaAtiva = child.key;
                    rotaEncontrada = true;
                    
                    if (txtRotaAtribuida) {
                        txtRotaAtribuida.innerText = `${dados.sede} - ${dados.nome} (${dados.trajeto})`;
                    }
                    
                    controlesJornada.classList.add('active');
                    if (dados.status) marcarStatusAtivo(dados.status);
                }
            });
        }
        if (!rotaEncontrada && txtRotaAtribuida) {
            txtRotaAtribuida.innerText = "Nenhuma rota atribuída para você hoje.";
            controlesJornada.classList.remove('active');
        }
    });

    const marcarStatusAtivo = (statusNome) => {
        statusBotoes.forEach(btn => {
            if(btn.getAttribute('data-status') === statusNome) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    };

    statusBotoes.forEach(botao => {
        botao.addEventListener('click', () => {
            if (!rotaAtiva) return;
            const statusAlvo = Math.random() ? botao.getAttribute('data-status') : botao.getAttribute('data-status');
            const statusReal = botao.getAttribute('data-status');
            
            database.ref(`rotas/${rotaAtiva}`).update({
                status: statusReal
            }).then(() => {
                marcarStatusAtivo(statusReal);
                if(statusReal === "Fora de Operação" && gpsIntervalo) {
                    btnToggleGps.click();
                }
            });
        });
    });

    incidentBotoes.forEach(botao => {
        botao.addEventListener('click', () => {
            if (!rotaAtiva) return;
            const motivoTexto = botao.getAttribute('data-motivo');
            incidentBotoes.forEach(b => b.classList.remove('active'));
            botao.classList.add('active');

            database.ref(`rotas/${rotaAtiva}`).update({
                motivo: motivoTexto
            });
        });
    });

    btnToggleGps.addEventListener('click', () => {
        if (!rotaAtiva) return;
        const indicadorBox = document.getElementById('gps-indicator');
        
        if (!gpsIntervalo) {
            gpsIntervalo = setInterval(() => {
                latSimulada += (Math.random() - 0.5) * 0.0005;
                lngSimulada += (Math.random() - 0.5) * 0.0005;

                database.ref(`rotas/${rotaAtiva}`).update({
                    latitude: latSimulada,
                    longitude: lngSimulada
                });
            }, 4000);

            btnToggleGps.classList.add('active');
            btnToggleGps.innerHTML = '<i class="fa-solid fa-satellite-dish"></i> Desligar Transmissão GPS';
            indicadorBox.classList.add('active');
            gpsStatusText.innerText = "Transmitindo Localização...";
        } else {
            clearInterval(gpsIntervalo);
            gpsIntervalo = null;
            btnToggleGps.classList.remove('active');
            btnToggleGps.innerHTML = '<i class="fa-solid fa-satellite-dish"></i> Ativar Transmissão GPS (Simulado)';
            indicadorBox.classList.remove('active');
            gpsStatusText.innerText = "Transmissão Desligada";
        }
    });
    
    document.getElementById('btn-sair-painel').addEventListener('click', () => {
        Swal.fire({
            title: 'Encerrar Turno?',
            text: "Os alunos não conseguirão mais ver sua posição atualizada.",
            icon: 'warning',
            showCancelButton: true,
            background: '#0A192F',
            color: 'white',
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#7f8c8d',
            confirmButtonText: 'Sim, Sair',
            cancelButtonText: 'Voltar'
        }).then((result) => {
            if (result.isConfirmed) {
                if (gpsIntervalo) clearInterval(gpsIntervalo);
                localStorage.clear();
                window.location.href = 'index.html';
            }
        });
    });
});