import { useState } from 'react';
import React from 'react';
import http from '../services/http';
import { useAuth } from '../context/AuthContext';
import ClientActionAlert from '../ui/ClientActionAlert';

export function useObligationActions() {
  const { user, isClient } = useAuth();
  const [alertData, setAlertData] = useState({ isOpen: false, history: [], actionType: 'VIEW', onClose: null });

  const checkClientHistory = async (obligationId, actionType) => {
    if (!isClient || !user) {
      return { shouldShow: false, history: [] };
    }

    try {
      const response = await http.get(`/api/obligations/${obligationId}/client-views`);
      const history = response.data || [];

      const otherUsersHistory = history.filter(item => item.userEmail !== user.email);

      return {
        shouldShow: otherUsersHistory.length > 0,
        history: otherUsersHistory
      };
    } catch (error) {
      return { shouldShow: false, history: [] };
    }
  };

  const handleViewObligation = async (obligationId) => {
    try {
      console.log('🔍 Iniciando visualização da obrigação:', obligationId);
      if (isClient && user) {
        try {
          console.log('🔍 Verificando histórico para cliente...');
          const { shouldShow, history } = await checkClientHistory(obligationId, 'VIEW');
          console.log('📊 Resultado da verificação:', { shouldShow, historyLength: history?.length });
          
          if (shouldShow && history && history.length > 0) {
            console.log('⚠️ Mostrando alerta de histórico...');
            await new Promise((resolve) => {
              const handleClose = () => {
                console.log('✅ Alerta fechado pelo usuário');
                setAlertData({ isOpen: false, history: [], actionType: 'VIEW', onClose: null });
                resolve();
              };
              
              setAlertData({ 
                isOpen: true, 
                history, 
                actionType: 'VIEW',
                onClose: handleClose
              });
            });
            console.log('✅ Continuando após alerta...');
          } else {
            console.log('ℹ️ Nenhum histórico para mostrar');
          }
        } catch (historyError) {
          console.warn('⚠️ Erro ao verificar histórico (continuando mesmo assim):', historyError);
        }
      } else {
        console.log('ℹ️ Não é cliente ou usuário não logado, pulando verificação de histórico');
      }

      console.log('📁 Buscando arquivos da obrigação...');
      const filesResponse = await http.get(`/api/obligations/${obligationId}/files`);
      const files = filesResponse.data;
      console.log('📁 Arquivos encontrados:', files.length);
      
      if (files.length === 0) {
        alert('Esta obrigação não possui arquivos anexados.');
        return;
      }

      if (files.length === 1) {
        console.log('📄 Gerando URL de visualização para arquivo único...');
        const viewResponse = await http.get(`/api/obligations/files/${files[0].id}/view`);
        console.log('✅ URL gerada, abrindo...', viewResponse.data.viewUrl);
        window.open(viewResponse.data.viewUrl, '_blank');
        return;
      }

      const fileNames = files.map((file, index) => `${index + 1}. ${file.originalName}`).join('\n');
      const choice = prompt(`Múltiplos arquivos encontrados:\n\n${fileNames}\n\nDigite o número do arquivo (1-${files.length}):`);
      
      const fileIndex = parseInt(choice) - 1;
      if (fileIndex >= 0 && fileIndex < files.length) {
        const selectedFile = files[fileIndex];
        const viewResponse = await http.get(`/api/obligations/files/${selectedFile.id}/view`);
        window.open(viewResponse.data.viewUrl, '_blank');
      }
    } catch (error) {
      alert('Erro ao visualizar arquivo. Tente novamente.');
    }
  };

  const handleDownloadFiles = async (obligationId) => {
    try {
      console.log('🔍 Iniciando download da obrigação:', obligationId);
      if (isClient && user) {
        try {
          console.log('🔍 Verificando histórico para cliente...');
          const { shouldShow, history } = await checkClientHistory(obligationId, 'DOWNLOAD');
          console.log('📊 Resultado da verificação:', { shouldShow, historyLength: history?.length });
          
          if (shouldShow && history && history.length > 0) {
            console.log('⚠️ Mostrando alerta de histórico...');
            await new Promise((resolve) => {
              const handleClose = () => {
                console.log('✅ Alerta fechado pelo usuário');
                setAlertData({ isOpen: false, history: [], actionType: 'VIEW', onClose: null });
                resolve();
              };
              
              setAlertData({ 
                isOpen: true, 
                history, 
                actionType: 'DOWNLOAD',
                onClose: handleClose
              });
            });
            console.log('✅ Continuando após alerta...');
          } else {
            console.log('ℹ️ Nenhum histórico para mostrar');
          }
        } catch (historyError) {
          console.warn('⚠️ Erro ao verificar histórico (continuando mesmo assim):', historyError);
        }
      } else {
        console.log('ℹ️ Não é cliente ou usuário não logado, pulando verificação de histórico');
      }

      console.log('📁 Buscando arquivos da obrigação...');
      const filesResponse = await http.get(`/api/obligations/${obligationId}/files`);
      const files = filesResponse.data;
      
      if (files.length === 0) {
        alert('Esta obrigação não possui arquivos anexados.');
        return;
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const downloadResponse = await http.get(`/api/obligations/files/${file.id}/download`);
          
          const link = document.createElement('a');
          link.href = downloadResponse.data.downloadUrl;
          link.download = file.originalName;
          link.style.display = 'none';

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

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
      alert('Erro ao baixar arquivos. Tente novamente.');
    }
  };

  const handleDeleteObligation = async (obligationId, onSuccess) => {
    if (!confirm('Tem certeza que deseja excluir esta obrigação? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      const filesResponse = await http.get(`/api/obligations/${obligationId}/files`);
      const files = filesResponse.data;
      
      for (const file of files) {
        try {
          await http.delete(`/api/obligations/files/${file.id}`);
        } catch (fileError) {
          console.error(`Erro ao excluir arquivo ${file.originalName}:`, fileError);
        }
      }
      
      await http.delete(`/api/obligations/${obligationId}`);
      
      alert('Obrigação excluída com sucesso!');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      alert('Erro ao excluir obrigação. Tente novamente.');
    }
  };

  const alertComponent = React.createElement(ClientActionAlert, {
    key: `alert-${alertData.isOpen}-${alertData.history?.length || 0}-${alertData.actionType}`,
    isOpen: alertData.isOpen,
    onClose: alertData.onClose || (() => {
      console.log('🔒 Fechando alerta via fallback');
      setAlertData({ isOpen: false, history: [], actionType: 'VIEW', onClose: null });
    }),
    history: alertData.history || [],
    actionType: alertData.actionType || 'VIEW'
  });

  return {
    handleViewObligation,
    handleDownloadFiles,
    handleDeleteObligation,
    alertComponent
  };
}
