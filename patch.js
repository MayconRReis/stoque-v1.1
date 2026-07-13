const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const insertCode = `
  const [isUnconsolidating, setIsUnconsolidating] = useState(false);
  const handleUnconsolidate = useCallback(async (groupId: string) => {
    setIsUnconsolidating(true);
    try {
      const historyId = crypto.randomUUID();
      await supabaseService.unconsolidatePallets(groupId, historyId, user?.id || null, user?.name || 'Operador');
      showNotification('Grupo desconsolidado com sucesso!', 'success');
      setDetailContext(null);
      const refreshEvent = new CustomEvent('refresh-inventory');
      window.dispatchEvent(refreshEvent);
      const refreshEventDash = new CustomEvent('refresh-dashboard');
      window.dispatchEvent(refreshEventDash);
    } catch (error: any) {
      console.error('Error unconsolidating:', error);
      showNotification(error.message || 'Erro ao desconsolidar grupo', 'error');
    } finally {
      setIsUnconsolidating(false);
    }
  }, [user, showNotification]);
`;

code = code.replace("setDetailContext({ row, inspection, idx });\r\n  }, []);\r\n", "setDetailContext({ row, inspection, idx });\r\n  }, []);\r\n" + insertCode.replace(/\n/g, '\r\n'));
fs.writeFileSync('App.tsx', code);
