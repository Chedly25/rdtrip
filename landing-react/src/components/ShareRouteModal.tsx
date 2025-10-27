import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Check, Mail, MessageCircle, Eye, Lock, Share2, QrCode, Edit3 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

interface ShareRouteModalProps {
  isOpen: boolean
  onClose: () => void
  routeId: string
  routeName: string
  shareToken?: string | null
  isPublic: boolean
  viewCount?: number
  onShare: () => Promise<{ shareUrl: string; shareToken: string }>
  onStopSharing: () => Promise<void>
}

export default function ShareRouteModal({
  isOpen,
  onClose,
  routeName,
  shareToken,
  isPublic,
  viewCount = 0,
  onShare,
  onStopSharing
}: ShareRouteModalProps) {
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [localShareUrl, setLocalShareUrl] = useState<string>('')
  const [localIsPublic, setLocalIsPublic] = useState(isPublic)
  const [localViewCount, setLocalViewCount] = useState(viewCount)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showQRCode, setShowQRCode] = useState(false)
  const [customMessage, setCustomMessage] = useState(`Check out my route: ${routeName}`)
  const [editingMessage, setEditingMessage] = useState(false)

  useEffect(() => {
    setLocalIsPublic(isPublic)
    if (shareToken) {
      const baseUrl = window.location.origin
      setLocalShareUrl(`${baseUrl}/shared/${shareToken}`)
    }
  }, [isPublic, shareToken])

  useEffect(() => {
    setLocalViewCount(viewCount)
  }, [viewCount])

  const handleShare = async () => {
    setLoading(true)
    setToast(null)
    try {
      const result = await onShare()
      setLocalShareUrl(result.shareUrl)
      setLocalIsPublic(true)
      setToast({ message: 'Route shared successfully!', type: 'success' })
      setTimeout(() => setToast(null), 3000)
    } catch (error) {
      console.error('Error sharing route:', error)
      setToast({ message: 'Failed to share route. Please try again.', type: 'error' })
      setTimeout(() => setToast(null), 3000)
    } finally {
      setLoading(false)
    }
  }

  const handleStopSharing = async () => {
    if (!confirm('Are you sure you want to stop sharing this route? The current link will no longer work.')) {
      return
    }

    setLoading(true)
    setToast(null)
    try {
      await onStopSharing()
      setLocalShareUrl('')
      setLocalIsPublic(false)
      setToast({ message: 'Sharing disabled successfully', type: 'success' })
      setTimeout(() => setToast(null), 3000)
    } catch (error) {
      console.error('Error stopping share:', error)
      setToast({ message: 'Failed to stop sharing. Please try again.', type: 'error' })
      setTimeout(() => setToast(null), 3000)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(localShareUrl)
    setCopied(true)
    setToast({ message: 'Link copied to clipboard!', type: 'success' })
    setTimeout(() => {
      setCopied(false)
      setToast(null)
    }, 2000)
  }

  const shareViaWhatsApp = () => {
    const message = `${customMessage}\n${localShareUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  const shareViaEmail = () => {
    const subject = routeName
    const body = `${customMessage}\n\n${localShareUrl}\n\nCreate your own personalized route at ${window.location.origin}`
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Share2 className="h-5 w-5 text-slate-700" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Share Route</h2>
                <p className="text-sm text-gray-500">{routeName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {!localIsPublic ? (
              /* Not yet shared - Show enable sharing */
              <div className="text-center py-8">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full">
                  <Lock className="h-8 w-8 text-slate-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Route is Private</h3>
                <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                  Share this route with others via a unique link. Anyone with the link can view your route without creating an account.
                </p>
                <button
                  onClick={handleShare}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Generating Link...
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4" />
                      Enable Sharing
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Already shared - Show share options */
              <>
                {/* Share URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Share Link</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={localShareUrl}
                      readOnly
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 text-sm font-mono"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Anyone with this link can view your route
                  </p>
                </div>

                {/* Social Share Buttons */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Share Via</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={shareViaWhatsApp}
                      className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-green-200 text-green-700 rounded-lg font-medium hover:bg-green-50 hover:border-green-300 transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </button>
                    <button
                      onClick={shareViaEmail}
                      className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-blue-200 text-blue-700 rounded-lg font-medium hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      <Mail className="h-4 w-4" />
                      Email
                    </button>
                  </div>
                </div>

                {/* Custom Share Message */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Custom Message</label>
                    <button
                      onClick={() => setEditingMessage(!editingMessage)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      <Edit3 className="h-3 w-3" />
                      {editingMessage ? 'Done' : 'Edit'}
                    </button>
                  </div>
                  {editingMessage ? (
                    <textarea
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      rows={3}
                      placeholder="Enter your custom message..."
                    />
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                      {customMessage}
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    This message will be used when sharing via WhatsApp or Email
                  </p>
                </div>

                {/* QR Code */}
                <div>
                  <button
                    onClick={() => setShowQRCode(!showQRCode)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-indigo-200 text-indigo-700 rounded-lg font-medium hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                  >
                    <QrCode className="h-4 w-4" />
                    {showQRCode ? 'Hide QR Code' : 'Show QR Code'}
                  </button>
                  <AnimatePresence>
                    {showQRCode && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 flex flex-col items-center"
                      >
                        <div className="p-4 bg-white rounded-lg shadow-sm border-2 border-gray-200">
                          <QRCodeSVG
                            value={localShareUrl}
                            size={200}
                            level="M"
                            includeMargin={true}
                          />
                        </div>
                        <p className="mt-2 text-xs text-center text-gray-500">
                          Scan this QR code to open the route on mobile
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Statistics */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Eye className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Views</p>
                        <p className="text-2xl font-bold text-gray-900">{localViewCount}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stop Sharing Button */}
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleStopSharing}
                    disabled={loading}
                    className="w-full px-4 py-3 border-2 border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="inline-block animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full mr-2" />
                        Disabling...
                      </>
                    ) : (
                      <>
                        <Lock className="inline-block h-4 w-4 mr-2" />
                        Stop Sharing
                      </>
                    )}
                  </button>
                  <p className="mt-2 text-xs text-center text-gray-500">
                    This will make the route private and disable the current link
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Toast Notification */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`absolute bottom-4 left-4 right-4 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
                  toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                } text-white`}
              >
                {toast.type === 'success' ? (
                  <Check className="h-5 w-5 flex-shrink-0" />
                ) : (
                  <X className="h-5 w-5 flex-shrink-0" />
                )}
                <p className="font-medium">{toast.message}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
