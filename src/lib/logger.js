const isDev = import.meta.env.DEV

export function logError(context, error, extra = {}) {
  if (error) console.error(`[${context}]`, { message: error?.message, code: error?.code, ...extra })
}

export function logInfo(context, message, extra = {}) {
  if (isDev) console.info(`[${context}]`, message, extra)
}
