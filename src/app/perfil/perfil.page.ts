import { Component, OnInit } from '@angular/core';
import { ApiService } from '../shared/api.service';
import { Storage } from '@ionic/storage-angular';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { PostagemService } from '../services/postagem.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
})
export class PerfilPage implements OnInit {
  usuario: any = null;
  carregando: boolean = true;
  editando: boolean = false;
  arquivoFoto: File | null = null;
  previewFoto: string | null = null;
  erro: string = '';

  postagens: any[] = [];
  novaPostagem = { titulo: '', conteudo: '' };
  carregandoPostagens: boolean = false;

  constructor(
    private apiService: ApiService,
    private storage: Storage,
    private router: Router,
    private alertController: AlertController,
    private postagemService: PostagemService
  ) {}

  async ngOnInit() {
    await this.carregarUsuario();
  }

  async carregarUsuario() {
    try {
      this.carregando = true;
      this.erro = '';

      const token = await this.storage.get('auth_token');
      if (!token) {
        this.erro = 'Token não encontrado. Faça login novamente.';
        this.router.navigate(['/login']);
        return;
      }

      const userData = await this.storage.get('user_data');
      if (userData) this.usuario = userData;

      this.apiService.get('usuario/perfil').subscribe({
        next: (resp: any) => {
          if (resp && typeof resp === 'object' && Object.keys(resp).length > 0) {
            this.processarDadosAPI(resp);
          } else {
            this.erro = 'API retornou dados vazios. ';
            if (this.usuario) {
              this.erro += 'Usando dados salvos localmente.';
            } else {
              this.erro += 'Nenhum dado local encontrado.';
              this.usuario = this.criarUsuarioPadrao();
            }
          }
          this.carregando = false;
          if (this.usuario?.id) this.carregarPostagens();
        },
        error: (err) => {
          this.carregando = false;
          this.erro = `Erro ao conectar com a API: ${err.status}. `;
          if (this.usuario) {
            this.erro += 'Usando dados locais.';
          } else {
            this.erro += 'Nenhum dado local encontrado.';
            this.usuario = this.criarUsuarioPadrao();
          }
          this.carregarPostagens();
        }
      });
    } catch (error) {
      this.carregando = false;
      this.erro = 'Erro interno ao carregar perfil';
      this.carregarPostagens();
    }
  }

  private processarDadosAPI(dados: any) {
    let dadosUsuario = null;
    const caminhos = ['data', 'usuario', 'user', 'perfil', 'profile', 'cliente'];
    for (const caminho of caminhos) {
      if (dados[caminho]) {
        dadosUsuario = dados[caminho];
        break;
      }
    }
    if (!dadosUsuario && (dados.name || dados.email)) {
      dadosUsuario = dados;
    }

    if (dadosUsuario) {
      this.usuario = {
        name: dadosUsuario.name || dadosUsuario.nome || '',
        email: dadosUsuario.email || '',
        status: dadosUsuario.status || 'Ativo',
        picture: dadosUsuario.picture || dadosUsuario.foto || null,
        id: dadosUsuario.id || null
      };
      this.storage.set('user_data', this.usuario);
    } else {
      this.erro = 'Não foi possível extrair dados do usuário da resposta da API.';
      this.usuario = this.criarUsuarioPadrao();
    }
  }

  private criarUsuarioPadrao() {
    return {
      name: 'Usuário',
      email: 'usuario@exemplo.com',
      status: 'Ativo',
      picture: null,
      id: Date.now() // ID temporário
    };
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
      this.mostrarErro('Selecione uma imagem válida');
      return;
    }
    this.arquivoFoto = file;
    const reader = new FileReader();
    reader.onload = (e: any) => this.previewFoto = e.target.result;
    reader.readAsDataURL(file);
  }

  uploadFoto() {
    if (!this.arquivoFoto) {
      this.mostrarErro('Selecione uma imagem primeiro');
      return;
    }
    const formData = new FormData();
    formData.append('foto', this.arquivoFoto);

    this.apiService.post('usuario/foto-upload', formData).subscribe({
      next: (resp: any) => {
        this.usuario.picture = resp.picture_url || resp.foto || resp.url;
        this.arquivoFoto = null;
        this.previewFoto = null;
        this.mostrarSucesso('Foto atualizada!');
      },
      error: () => this.mostrarErro('Erro ao atualizar foto')
    });
  }

  toggleEdicao() {
    this.editando = !this.editando;
  }

  salvarPerfil() {
    if (!this.usuario?.name?.trim()) {
      this.mostrarErro('Nome é obrigatório');
      return;
    }
    this.apiService.post('usuario/editar', this.usuario).subscribe({
      next: () => {
        this.editando = false;
        this.mostrarSucesso('Perfil atualizado!');
        this.storage.set('user_data', this.usuario);
      },
      error: () => this.mostrarErro('Erro ao salvar perfil')
    });
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Sair',
      message: 'Deseja realmente sair?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sair',
          handler: () => {
            this.storage.remove('auth_token');
            this.storage.remove('user_data');
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  private async mostrarErro(mensagem: string) {
    const alert = await this.alertController.create({
      header: 'Erro',
      message: mensagem,
      buttons: ['OK']
    });
    await alert.present();
  }

  private async mostrarSucesso(mensagem: string) {
    const alert = await this.alertController.create({
      header: 'Sucesso',
      message: mensagem,
      buttons: ['OK']
    });
    await alert.present();
  }

  carregarPostagens() {
    if (!this.usuario?.id) {
      console.warn('ID do usuário não disponível para carregar postagens');
      return;
    }

    this.carregandoPostagens = true;
    
    this.postagemService.listarPostagens(this.usuario.id).subscribe({
      next: (dados) => {
        this.postagens = dados || [];
        this.carregandoPostagens = false;
      },
      error: (err) => {
        console.error('Erro ao carregar postagens:', err);
        this.carregandoPostagens = false;
        this.postagens = [];
      }
    });
  }

  adicionarPostagem() {
    if (!this.novaPostagem.titulo.trim() || !this.novaPostagem.conteudo.trim()) {
      this.mostrarErro('Título e conteúdo são obrigatórios');
      return;
    }

    if (!this.usuario?.id) {
      this.mostrarErro('Usuário não identificado');
      return;
    }

    const postagem = {
      ...this.novaPostagem,
      usuarioId: this.usuario.id,
      usuarioNome: this.usuario.name,
      data: new Date().toISOString()
    };

    this.postagemService.criarPostagem(postagem).subscribe({
      next: (nova) => {
        this.postagens.unshift(nova);
        this.novaPostagem = { titulo: '', conteudo: '' };
        this.mostrarSucesso('Postagem criada com sucesso!');
      },
      error: (err) => {
        console.error('Erro ao criar postagem:', err);
        this.mostrarErro('Erro ao criar postagem. Verifique sua conexão.');
      }
    });
  }

  async testarConexaoAPI() {
    const alert = await this.alertController.create({
      header: 'Teste de Conexão',
      message: 'Testando conexão com a API...',
      buttons: ['OK']
    });
    
    await alert.present();

    this.apiService.get('usuario/perfil').subscribe({
      next: () => {
        alert.message = 'Conexão com a API estabelecida com sucesso!';
      },
      error: (err) => {
        alert.message = `Erro na conexão: ${err.status} - ${err.statusText}`;
      }
    });
  }
}