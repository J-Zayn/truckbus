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

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

const formSede = document.getElementById('form-cadastro-sede');
const formRota = document.getElementById('form-cadastro-rota');
const rotaSedeSelect = document.getElementById('rota-sede-select');
const rotaMotoristaSelect = document.getElementById('rota-motorista-select');
const listaRotasContainer = document.getElementById('lista-rotas-container');
const formMotorista = document.getElementById('form-cadastro-motorista');
const listaMotoristasContainer = document.getElementById('lista-motoristas-container');
const formAviso = document.getElementById('form-transmissao-aviso');
const listaAvisosContainer = document.getElementById('lista-avisos-container');
const listaFeedbacksPostgres = document.getElementById('lista-feedbacks-postgres');
const btnSair = document.getElementById('btn-voltar-index');

const gerarMatriculaAleatoria = () => {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let resultado = '';
    for (let i = 0; i < 5; i++) {
        resultado += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return resultado;
};

if (formSede) {
    formSede.addEventListener('submit', (e) => {
        e.preventDefault();
        const nomeSede = document.getElementById('cad-nome-sede').value.trim();
        database.ref('sedes').push({ nome: nomeSede })
        .then(() => {
            Swal.fire({
                title: 'Sucesso!',
                text: 'Cidade polo adicionada com sucesso.',
                icon: 'success',
                background: '#0A192F',
                color: 'white',
                confirmButtonColor: '#00B4D8'
            });
            formSede.reset();
        });
    });
}

if (rotaSedeSelect) {
    database.ref('sedes').on('value', (snapshot) => {
        rotaSedeSelect.innerHTML = '<option value="">Escolha uma cidade...</option>';
        if (snapshot.exists()) {
            snapshot.forEach((childSnap) => {
                const dados = childSnap.val();
                const option = document.createElement('option');
                option.value = dados.nome;
                option.textContent = dados.nome;
                rotaSedeSelect.appendChild(option);
            });
        } else {
            rotaSedeSelect.innerHTML = '<option value="">Cadastre uma sede primeiro</option>';
        }
    });
}

if (rotaMotoristaSelect) {
    database.ref('motoristas').on('value', (snapshot) => {
        rotaMotoristaSelect.innerHTML = '<option value="">Selecione o condutor...</option>';
        if (snapshot.exists()) {
            snapshot.forEach((childSnap) => {
                const dados = childSnap.val();
                const option = document.createElement('option');
                option.value = dados.nome;
                option.textContent = dados.nome;
                rotaMotoristaSelect.appendChild(option);
            });
        } else {
            rotaMotoristaSelect.innerHTML = '<option value="">Cadastre um motorista primeiro</option>';
        }
    });
}

if (formRota) {
    formRota.addEventListener('submit', (e) => {
        e.preventDefault();
        const sedeSelecionada = rotaSedeSelect.value;
        const nomeRota = document.getElementById('cad-nome-rota').value.trim();
        const trajeto = document.getElementById('cad-trajeto-rota').value.trim();
        const inicio = document.getElementById('cad-inicio-rota').value.trim();
        const chegada = document.getElementById('cad-chegada-rota').value.trim();
        const itinerario = document.getElementById('cad-itinerario-rota').value.trim();
        const motorista = rotaMotoristaSelect.value;

        if (!sedeSelecionada || !motorista) {
            Swal.fire({ title: 'Erro', text: 'Selecione a cidade polo e o condutor responsável.', icon: 'error', background: '#0A192F', color: 'white' });
            return;
        }

        database.ref('rotas').push({ 
            nome: nomeRota, 
            sede: sedeSelecionada,
            trajeto: trajeto,
            inicio: inicio,
            chegada: chegada,
            itinerario: itinerario,
            motorista: motorista,
            status: "Fora de Operação",
            motivo: "Viagem não iniciada"
        })
        .then(() => {
            Swal.fire({
                title: 'Rota Criada!',
                text: 'Nova linha adicionada com sucesso.',
                icon: 'success',
                background: '#0A192F',
                color: 'white',
                confirmButtonColor: '#00B4D8'
            });
            formRota.reset();
        });
    });
}

if (listaRotasContainer) {
    database.ref('rotas').on('value', (snapshot) => {
        listaRotasContainer.innerHTML = "";
        if (!snapshot.exists()) {
            listaRotasContainer.innerHTML = '<div style="color: #64748B; text-align:center; padding:15px; font-size:0.85rem;">Nenhuma rota cadastrada.</div>';
            return;
        }
        snapshot.forEach((childSnapshot) => {
            const idRota = childSnapshot.key;
            const dados = childSnapshot.val();
            const cardRota = document.createElement('div');
            cardRota.style.backgroundColor = 'var(--bg-principal)';
            cardRota.style.border = '1px solid var(--borda-sutil)';
            cardRota.style.borderRadius = '8px';
            cardRota.style.padding = '12px';
            cardRota.style.marginBottom = '10px';
            cardRota.style.display = 'flex';
            cardRota.style.justifyContent = 'space-between';
            cardRota.style.alignItems = 'center';

            cardRota.innerHTML = `
                <div>
                    <strong style="color:white; display:block; font-size:0.95rem;"><i class="fa-solid fa-route" style="color:#8A99AD; margin-right:6px;"></i> ${dados.sede} - ${dados.nome}</strong>
                    <span style="color:#8A99AD; font-size:0.8rem; display:block; margin-top:2px;">Trajeto: ${dados.trajeto || 'Não informado'}</span>
                    <span style="color:#00B4D8; font-size:0.75rem; font-weight:600;">Condutor: ${dados.motorista || 'Não alocado'}</span>
                </div>
                <button class="btn-deletar-rota" data-id="${idRota}" style="background:none; border:1px solid #EF4444; color:#EF4444; padding:6px 10px; border-radius:6px; cursor:pointer; transition:0.2s;">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            `;
            listaRotasContainer.appendChild(cardRota);
        });

        document.querySelectorAll('.btn-deletar-rota').forEach(botao => {
            botao.addEventListener('click', (e) => {
                const idDaRota = e.currentTarget.getAttribute('data-id');
                Swal.fire({
                    title: 'Excluir Rota Escolar?',
                    text: "Alunos e motoristas perderão o acesso a esta linha imediatamente.",
                    icon: 'warning',
                    showCancelButton: true,
                    background: '#0A192F',
                    color: 'white',
                    confirmButtonColor: '#EF4444',
                    cancelButtonColor: '#1E3A8A',
                    confirmButtonText: 'Sim, excluir!',
                    cancelButtonText: 'Cancelar'
                }).then((result) => {
                    if (result.isConfirmed) {
                        database.ref('rotas/' + idDaRota).remove()
                        .then(() => {
                            Swal.fire({
                                title: 'Excluída!',
                                text: 'A linha foi descontinuada do sistema.',
                                icon: 'success',
                                background: '#0A192F',
                                color: 'white',
                                confirmButtonColor: '#00B4D8'
                            });
                        });
                    }
                });
            });
        });
    });
}

if (formMotorista) {
    formMotorista.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = document.getElementById('cad-nome-motorista').value.trim();
        const matricula = gerarMatriculaAleatoria();

        database.ref('motoristas').push({ nome, matricula })
        .then(() => {
            Swal.fire({
                title: 'Código Gerado!',
                text: `Motorista cadastrado. Matrícula de acesso: ${matricula}`,
                icon: 'success',
                background: '#0A192F',
                color: 'white',
                confirmButtonColor: '#00B4D8'
            });
            formMotorista.reset();
        });
    });
}

if (listaMotoristasContainer) {
    database.ref('motoristas').on('value', (snapshot) => {
        listaMotoristasContainer.innerHTML = "";
        if (!snapshot.exists()) {
            listaMotoristasContainer.innerHTML = '<div style="color: #64748B; text-align:center; padding:15px; font-size:0.85rem;">Nenhum motorista cadastrado.</div>';
            return;
        }
        snapshot.forEach((childSnapshot) => {
            const idMotorista = childSnapshot.key;
            const dados = childSnapshot.val();
            const cardMotorista = document.createElement('div');
            cardMotorista.style.backgroundColor = 'var(--bg-principal)';
            cardMotorista.style.border = '1px solid var(--borda-sutil)';
            cardMotorista.style.borderRadius = '8px';
            cardMotorista.style.padding = '12px';
            cardMotorista.style.marginBottom = '10px';
            cardMotorista.style.display = 'flex';
            cardMotorista.style.justifyContent = 'space-between';
            cardMotorista.style.alignItems = 'center';

            cardMotorista.innerHTML = `
                <div>
                    <strong style="color:white; display:block; font-size:0.95rem;"><i class="fa-solid fa-id-card" style="color:#8A99AD; margin-right:6px;"></i> ${dados.nome}</strong>
                    <span style="color:#00B4D8; font-size:0.8rem; font-weight:600;">Acesso: ${dados.matricula || 'Sem código'}</span>
                </div>
                <button class="btn-deletar-motorista" data-id="${idMotorista}" style="background:none; border:1px solid #EF4444; color:#EF4444; padding:6px 10px; border-radius:6px; cursor:pointer; transition:0.2s;">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            `;
            listaMotoristasContainer.appendChild(cardMotorista);
        });

        document.querySelectorAll('.btn-deletar-motorista').forEach(botao => {
            botao.addEventListener('click', (e) => {
                const idDoCara = e.currentTarget.getAttribute('data-id');
                Swal.fire({
                    title: 'Excluir Motorista?',
                    text: "Ele perderá o acesso ao painel do condutor imediatamente.",
                    icon: 'warning',
                    showCancelButton: true,
                    background: '#0A192F',
                    color: 'white',
                    confirmButtonColor: '#EF4444',
                    cancelButtonColor: '#1E3A8A',
                    confirmButtonText: 'Sim, excluir!',
                    cancelButtonText: 'Cancelar'
                }).then((result) => {
                    if (result.isConfirmed) {
                        database.ref('motoristas/' + idDoCara).remove()
                        .then(() => {
                            Swal.fire({
                                title: 'Removido!',
                                text: 'O motorista foi desvinculado do sistema.',
                                icon: 'success',
                                background: '#0A192F',
                                color: 'white',
                                confirmButtonColor: '#00B4D8'
                            });
                        });
                    }
                });
            });
        });
    });
}

if (formAviso) {
    formAviso.addEventListener('submit', (e) => {
        e.preventDefault();
        const titulo = document.getElementById('aviso-titulo').value.trim();
        const mensagem = document.getElementById('aviso-mensagem').value.trim();
        const dataEnvio = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

        database.ref('avisos_globais').push({ titulo, mensagem, data: dataEnvio })
        .then(() => {
            Swal.fire({
                title: 'Aviso Transmitido!',
                text: 'O alerta já está visível para todos os alunos.',
                icon: 'success',
                background: '#0A192F',
                color: 'white',
                confirmButtonColor: '#00B4D8'
            });
            formAviso.reset();
        });
    });
}

if (listaAvisosContainer) {
    database.ref('avisos_globais').on('value', (snapshot) => {
        listaAvisosContainer.innerHTML = "";
        if (!snapshot.exists()) {
            listaAvisosContainer.innerHTML = '<div style="color: #64748B; text-align:center; padding:15px; font-size:0.85rem;">Nenhum aviso ativo na rede.</div>';
            return;
        }
        snapshot.forEach((childSnap) => {
            const idAviso = childSnap.key;
            const dados = childSnap.val();
            const cardAviso = document.createElement('div');
            cardAviso.style.backgroundColor = 'var(--bg-principal)';
            cardAviso.style.border = '1px solid var(--borda-sutil)';
            cardAviso.style.borderRadius = '8px';
            cardAviso.style.padding = '14px';
            cardAviso.style.marginBottom = '10px';
            cardAviso.style.display = 'flex';
            cardAviso.style.justifyContent = 'space-between';
            cardAviso.style.alignItems = 'center';

            cardAviso.innerHTML = `
                <div style="flex: 1; padding-right: 10px;">
                    <strong style="color:white; font-size:0.95rem; display:block; margin-bottom:4px;">${dados.titulo}</strong>
                    <p style="color:#CBD5E1; font-size:0.85rem; margin:0 0 6px 0; line-height:1.4;">${dados.mensagem}</p>
                    <span style="color:#8A99AD; font-size:0.75rem;">Publicado em: ${dados.data}</span>
                </div>
                <button class="btn-deletar-aviso" data-id="${idAviso}" style="background:none; border:1px solid #EF4444; color:#EF4444; padding:8px; border-radius:6px; cursor:pointer; transition:0.2s;">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            `;
            listaAvisosContainer.appendChild(cardAviso);
        });

        document.querySelectorAll('.btn-deletar-aviso').forEach(botao => {
            botao.addEventListener('click', (e) => {
                const idDoAviso = e.currentTarget.getAttribute('data-id');
                database.ref('avisos_globais/' + idDoAviso).remove();
            });
        });
    });
}

if (listaFeedbacksPostgres) {
    database.ref('feedbacks_estudantes').on('value', (snapshot) => {
        listaFeedbacksPostgres.innerHTML = "";
        if (!snapshot.exists()) {
            listaFeedbacksPostgres.innerHTML = '<div style="color: #64748B; text-align:center; padding:20px; font-size:0.85rem;">Nenhum feedback recebido no painel.</div>';
            return;
        }
        snapshot.forEach((childSnap) => {
            const dados = childSnap.val();
            const card = document.createElement('div');
            card.style.backgroundColor = 'var(--bg-principal)';
            card.style.border = '1px solid var(--borda-sutil)';
            card.style.borderRadius = '8px';
            card.style.padding = '14px';
            card.style.marginBottom = '10px';

            let corEtiqueta = '#00B4D8';
            if (dados.tipo === 'Reclamação') corEtiqueta = '#EF4444';
            if (dados.tipo === 'Elogio') corEtiqueta = '#10B981';

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="background:${corEtiqueta}; color:var(--bg-principal); font-size:0.7rem; font-weight:700; padding:2px 8px; border-radius:4px; text-transform:uppercase;">${dados.tipo}</span>
                    <span style="color:#8A99AD; font-size:0.75rem;">${dados.data || ''}</span>
                </div>
                <strong style="color:white; font-size:0.9rem; display:block; margin-bottom:4px;"><i class="fa-solid fa-user-graduate" style="color:#94A3B8; margin-right:5px;"></i> ${dados.nome}</strong>
                <p style="color:#CBD5E1; font-size:0.85rem; margin:0; line-height:1.4;">${dados.mensagem}</p>
            `;
            listaFeedbacksPostgres.prepend(card);
        });
    });
}

if (btnSair) {
    btnSair.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
}