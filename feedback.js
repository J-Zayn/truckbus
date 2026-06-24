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

    const formFeedback = document.getElementById('form-feedback-estudante');

    if (formFeedback) {
        formFeedback.addEventListener('submit', (e) => {
            e.preventDefault();

            let nomeEstudante = document.getElementById('fb-nome').value.trim();
            const tipoMensagem = document.getElementById('fb-tipo').value;
            const textoMensagem = document.getElementById('fb-mensagem').value.trim();

            if (nomeEstudante === "") { 
                nomeEstudante = "Anônimo"; 
            }
            
            const dataEnvio = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

        
            database.ref('feedbacks_estudantes').push({
                nome: nomeEstudante,
                tipo: tipoMensagem,
                mensagem: textoMensagem,
                data: dataEnvio
            }).then(() => {
                Swal.fire({
                    title: 'Feedback Enviado!',
                    text: 'Sua mensagem foi entregue em tempo real para a secretaria.',
                    icon: 'success',
                    background: '#0A192F',
                    color: 'white',
                    confirmButtonColor: '#00B4D8'
                });
                formFeedback.reset();
            }).catch(() => {
                Swal.fire({ title: 'Erro ao enviar', text: 'Tente novamente.', icon: 'error', background: '#0A192F', color: 'white' });
            });
        });
    }
});