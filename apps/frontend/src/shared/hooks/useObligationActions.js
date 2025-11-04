import http from '../services/http';

/**
 * Hook compartilhado para ações de obrigações
 * Usado em Dashboard.jsx e ClientDashBoard.jsx
 */
export function useObligationActions() {
  /**
   * Visualiza um arquivo de uma obrigação
   */
  const handleViewObligation = async (obligationId) => {
    try {
      const filesResponse = await http.get(`/api/obligations/${obligationId}/files`);
      const files = filesResponse.data;
      
      if (files.length === 0) {
        alert('Esta obrigação não possui arquivos anexados.');
        return;
      }
      
      // Se há apenas um arquivo, abrir diretamente
      if (files.length === 1) {
        const viewResponse = await http.get(`/api/obligations/files/${files[0].id}/view`);
        window.open(viewResponse.data.viewUrl, '_blank');
        return;
      }
      
      // Se há múltiplos arquivos, mostrar lista simples
      const fileNames = files.map((file, index) => `${index + 1}. ${file.originalName}`).join('\n');
      const choice = prompt(`Múltiplos arquivos encontrados:\n\n${fileNames}\n\nDigite o número do arquivo (1-${files.length}):`);
      
      const fileIndex = parseInt(choice) - 1;
      if (fileIndex >= 0 && fileIndex < files.length) {
        const selectedFile = files[fileIndex];
        const viewResponse = await http.get(`/api/obligations/files/${selectedFile.id}/view`);
        window.open(viewResponse.data.viewUrl, '_blank');
      }
    } catch (error) {
      console.error('Erro ao visualizar arquivo:', error);
      alert('Erro ao visualizar arquivo. Tente novamente.');
    }
  };

  /**
   * Faz download de todos os arquivos de uma obrigação
   */
  const handleDownloadFiles = async (obligationId) => {
    try {
      const filesResponse = await http.get(`/api/obligations/${obligationId}/files`);
      const files = filesResponse.data;
      
      if (files.length === 0) {
        alert('Esta obrigação não possui arquivos anexados.');
        return;
      }
      
      // Baixar todos os arquivos sequencialmente
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const downloadResponse = await http.get(`/api/obligations/files/${file.id}/download`);
          
          // Criar link temporário para download direto
          const link = document.createElement('a');
          link.href = downloadResponse.data.downloadUrl;
          link.download = file.originalName;
          link.style.display = 'none';
          
          // Adicionar ao DOM, clicar e remover
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Pequena pausa entre downloads para evitar conflitos
          if (i < files.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (fileError) {
          console.error(`Erro ao baixar arquivo ${file.originalName}:`, fileError);
        }
      }
      
      if (files.length > 1) {
        alert(`${files.length} arquivos iniciaram o download.`);
      }
    } catch (error) {
      console.error('Erro ao baixar arquivos:', error);
      alert('Erro ao baixar arquivos. Tente novamente.');
    }
  };

  /**
   * Exclui uma obrigação e seus arquivos
   * @param {string} obligationId - ID da obrigação
   * @param {Function} onSuccess - Callback chamado após sucesso
   */
  const handleDeleteObligation = async (obligationId, onSuccess) => {
    if (!confirm('Tem certeza que deseja excluir esta obrigação? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      // Primeiro, excluir todos os arquivos da obrigação
      const filesResponse = await http.get(`/api/obligations/${obligationId}/files`);
      const files = filesResponse.data;
      
      for (const file of files) {
        try {
          await http.delete(`/api/obligations/files/${file.id}`);
        } catch (fileError) {
          console.error(`Erro ao excluir arquivo ${file.originalName}:`, fileError);
        }
      }
      
      // Depois, excluir a obrigação
      await http.delete(`/api/obligations/${obligationId}`);
      
      alert('Obrigação excluída com sucesso!');
      
      // Chamar callback de sucesso
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao excluir obrigação:', error);
      alert('Erro ao excluir obrigação. Tente novamente.');
    }
  };

  return {
    handleViewObligation,
    handleDownloadFiles,
    handleDeleteObligation
  };
}
