export function useCopyCode() {
  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      return true;
    } catch (err) {
      console.error('Failed to copy code:', err);
      return false;
    }
  };

  return {
    handleCopyCode,
  };
}
