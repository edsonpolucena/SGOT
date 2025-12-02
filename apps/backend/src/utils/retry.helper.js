function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryableError(error) {
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';
  
  const retryablePatterns = [
    'timeout',
    'network',
    'econnreset',
    'etimedout',
    'enotfound',
    'econnrefused',
    'service unavailable',
    'temporary',
    'retry',
    'rate limit',
    'throttl'
  ];
  
  return retryablePatterns.some(pattern => 
    errorMessage.includes(pattern) || errorCode.includes(pattern)
  );
}

async function retryOperation(operation, options = {}) {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    operationName = 'Operation',
    shouldRetry = isRetryableError
  } = options;

  let lastError = null;
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;
    
    try {
      const result = await operation();
      
      if (attempt > 1) {
        console.log(`✅ ${operationName} bem-sucedido na tentativa ${attempt}/${maxAttempts}`);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      const isLastAttempt = attempt >= maxAttempts;
      const willRetry = shouldRetry(error) && !isLastAttempt;
      
      if (isLastAttempt) {
        console.error(`❌ ${operationName} falhou após ${maxAttempts} tentativas:`, error.message);
        throw error;
      }
      
      if (!willRetry) {
        console.error(`❌ ${operationName} falhou com erro não retentável:`, error.message);
        throw error;
      }
      
      const delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt - 1),
        maxDelay
      );
      
      console.warn(`⚠️ ${operationName} falhou na tentativa ${attempt}/${maxAttempts}. Tentando novamente em ${delay}ms...`, error.message);
      
      await sleep(delay);
    }
  }
  
  throw lastError;
}

module.exports = {
  retryOperation,
  isRetryableError,
  sleep
};

