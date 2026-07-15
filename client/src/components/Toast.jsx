import { useToast } from '../context/ToastContext'

function Toast() {
  const { toasts, removeToast } = useToast()

  const bgColorClass = (type) => {
    switch (type) {
      case 'success':
        return 'bg-success-500'
      case 'error':
        return 'bg-error-500'
      case 'warning':
        return 'bg-yellow-500'
      default:
        return 'bg-blue-500'
    }
  }

  const iconClass = (type) => {
    switch (type) {
      case 'success':
        return '✓'
      case 'error':
        return '✕'
      case 'warning':
        return '⚠'
      default:
        return 'ℹ'
    }
  }

  return (
    <div className="fixed top-4 right-4 space-y-2 pointer-events-none z-50">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${bgColorClass(
            toast.type
          )} text-white px-6 py-3 rounded-lg shadow-lg flex items-center justify-between gap-4 min-w-[300px] animate-fadeIn pointer-events-auto`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">{iconClass(toast.type)}</span>
            <span>{toast.message}</span>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="hover:opacity-75 transition"
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

export default Toast
