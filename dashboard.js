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

    // SOLUÇÃO DE ARQUITETURA: Armazena a lista de rotas e qual está selecionada no momento
    let listaRotasDoMotorista = []; 
    let rotaSelecionadaId = null;
    let geoWatchId = null;

    database.ref('rotas').on('value', (snapshot) => {
        listaRotasDoMotorista = []; // Limpa a lista local
        
        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                const dados = child.val();
                if (dados.motorista === motoristaNome) {
                    // Guarda o objeto completo da rota
                    listaRotasDoMotorista.push({
                        id: child.key,
                        nome: dados.nome,
                        sede: dados.sede,
                        trajeto: dados.trajeto,
                        status: dados.status || "Fora de Operação"
                    });
                }
            });
        }
        
        // Se mudou o banco e a rota selecionada sumiu, reinicia para a primeira
        if (listaRotasDoMotorista.length > 0) {
            const aindaExiste = listaRotasDoMotorista.find(r => r.id === rotaSelecionadaId);
            if (!aindaExiste) {
                rotaSelecionadaId = listaRotasDoMotorista[0].id;
            }
            controlesJornada.classList.add('active');
            renderizarSeletorDeRotas();
        } else {
            rotaSelecionadaId = null;
            if (txtRotaAtribuida) txtRotaAtribuida.innerText = "Nenhuma rota atribuída para você hoje.";
            controlesJornada.classList.remove('active');
        }
    });

    // Função que cria o visual de seleção se houver mais de uma rota
    const renderizarSeletorDeRotas = () => {
        if (!txtRotaAtribuida) return;

        if (listaRotasDoMotorista.length === 1) {
            // Apenas 1 rota: Mostra o texto normal direto
            const rota = listaRotasDoMotorista[0];
            txtRotaAtribuida.innerText = `${rota.sede} - ${rota.nome} (${rota.trajeto})`;
            marcarStatusAtivo(rota.status);
        } else {
            // Múltiplas rotas: Cria o Dropdown dinâmico com estilo personalizado
            let htmlSelect = `<label style="display:block; margin-bottom:8px; font-size:12px; color:#64ffda;">Selecione a Rota para Operar:</label>`;
            htmlSelect += `<select id="select-rota-motorista" style="width:100%; padding:10px; background:#172A45; color:white; border:1px solid #64ffda; border-radius:5px; font-size:14px; outline:none;">`;
            
            listaRotasDoMotorista.forEach(rota => {
                const selecionado = rota.id === rotaSelecionadaId ? "selected" : "";
                htmlSelect += `<option value="${rota.id}" ${selecionado}>${rota.sede} - ${rota.nome}</option>`;
            });
            
            htmlSelect += `</select>`;
            txtRotaAtribuida.innerHTML = htmlSelect;

            // Escuta quando o motorista muda de rota no seletor
            const selectElement = document.getElementById('select-rota-motorista');
            if (selectElement) {
                selectElement.addEventListener('change', (e) => {
                    rotaSelecionadaId = e.target.value;
                    // Atualiza os botões para mostrar o status dessa rota selecionada
                    const rotaAtual = listaRotasDoMotorista.find(r => r.id === rotaSelecionadaId);
                    if (rotaAtual) marcarStatusAtivo(rotaAtual.status);
                });
            }

            // Marca o status inicial da rota que já estava selecionada
            const rotaAtual = listaRotasDoMotorista.find(r => r.id === rotaSelecionadaId);
            if (rotaAtual) marcarStatusAtivo(rotaAtual.status);
        }
    };

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
            if (!rotaSelecionadaId) return;
            const statusReal = botao.getAttribute('data-status');
            
            // ATUALIZA APENAS A ROTA SELECIONADA
            database.ref(`rotas/${rotaSelecionadaId}`).update({
                status: statusReal
            });

            if(statusReal === "Fora de Operação" && geoWatchId) {
                btnToggleGps.click();
            }
        });
    });

    incidentBotoes.forEach(botao => {
        botao.addEventListener('click', () => {
            if (!rotaSelecionadaId) return;
            const motivoTexto = botao.getAttribute('data-motivo');
            incidentBotoes.forEach(b => b.classList.remove('active'));
            botao.classList.add('active');

            // ENVIA ALERTA APENAS PARA A ROTA SELECIONADA
            database.ref(`rotas/${rotaSelecionadaId}`).update({
                motivo: motivoTexto
            });
        });
    });

    btnToggleGps.addEventListener('click', () => {
        if (!rotaSelecionadaId) return;
        const indicadorBox = document.getElementById('gps-indicator');
        
        if (!geoWatchId) {
            if ("geolocation" in navigator) {
                geoWatchId = navigator.geolocation.watchPosition((position) => {
                    const latReal = position.coords.latitude;
                    const lngReal = position.coords.longitude;

                    // TRANSMITE O GPS APENAS PARA A ROTA ATUALMENTE SELECIONADA
                    if (rotaSelecionadaId) {
                        database.ref(`rotas/${rotaSelecionadaId}`).update({
                            latitude: latReal,
                            longitude: lngReal
                        });
                    }
                }, (error) => {
                    Swal.fire({ title: 'Erro no GPS', text: 'Ative a localização e dê permissão.', icon: 'error', background: '#0A192F', color: 'white' });
                    if (geoWatchId) {
                        navigator.geolocation.clearWatch(geoWatchId);
                        geoWatchId = null;
                        btnToggleGps.classList.remove('active');
                        btnToggleGps.innerHTML = '<i class="fa-solid fa-satellite-dish"></i> Ativar Transmissão GPS';
                        indicadorBox.classList.remove('active');
                        gpsStatusText.innerText = "Transmissão Desligada";
                    }
                }, {
                    enableHighAccuracy: true,
                    maximumAge: 0,
                    timeout: 10000
                });

                btnToggleGps.classList.add('active');
                btnToggleGps.innerHTML = '<i class="fa-solid fa-satellite-dish"></i> Desligar Transmissão GPS';
                indicadorBox.classList.add('active');
                gpsStatusText.innerText = "Transmitindo Localização Real...";
            } else {
                Swal.fire({ title: 'Não Suportado', text: 'Sem suporte a GPS.', icon: 'error', background: '#0A192F', color: 'white' });
            }
        } else {
            navigator.geolocation.clearWatch(geoWatchId);
            geoWatchId = null;
            btnToggleGps.classList.remove('active');
            btnToggleGps.innerHTML = '<i class="fa-solid fa-satellite-dish"></i> Ativar Transmissão GPS';
            indicadorBox.classList.remove('active');
            gpsStatusText.innerText = "Transmissão Desligada";
        }
    });
    
    document.getElementById('btn-sair-painel').addEventListener('click', () => {
        Swal.fire({
            title: 'Encerrar Turno?',
            text: "Os alunos não conseguirão mais ver sua posição.",
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
                if (geoWatchId) navigator.geolocation.clearWatch(geoWatchId);
                localStorage.clear();
                window.location.href = 'index.html';
            }
        });
    });
});