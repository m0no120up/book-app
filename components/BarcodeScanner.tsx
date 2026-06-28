'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  onDetected: (isbn: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const readerRef = useRef<{ reset: () => void } | null>(null)

  useEffect(() => {
    let active = true

    async function startScanner() {
      try {
        // Dynamically import to avoid SSR issues
        const { BrowserMultiFormatReader, NotFoundException } = await import('@zxing/library')
        const codeReader = new BrowserMultiFormatReader()
        readerRef.current = codeReader

        const devices = await codeReader.listVideoInputDevices()
        const backCamera = devices.find(d =>
          d.label.toLowerCase().includes('back') ||
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        )
        const deviceId = backCamera?.deviceId ?? devices[0]?.deviceId

        if (!deviceId && devices.length === 0) {
          setError('カメラが見つかりません')
          return
        }

        setScanning(true)
        await codeReader.decodeFromVideoDevice(
          deviceId ?? null,
          videoRef.current!,
          (result, err) => {
            if (!active) return
            if (result) {
              const text = result.getText()
              // Filter for ISBN (13 digits starting with 978/979, or 10 digits)
              if (/^97[89]\d{10}$/.test(text) || /^\d{9}[\dX]$/.test(text)) {
                onDetected(text)
              }
            }
            if (err && !(err instanceof NotFoundException)) {
              console.error(err)
            }
          }
        )
      } catch (e) {
        if (active) {
          setError('カメラへのアクセスが拒否されました。ブラウザの設定を確認してください。')
          console.error(e)
        }
      }
    }

    startScanner()

    return () => {
      active = false
      readerRef.current?.reset()
    }
  }, [onDetected])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-gray-900">バーコードをスキャン</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <div className="relative bg-black" style={{ aspectRatio: '4/3' }}>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          {scanning && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Scanning overlay */}
              <div className="w-64 h-32 border-2 border-blue-400 rounded-lg relative">
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-blue-400 animate-scan" />
              </div>
            </div>
          )}
        </div>

        <div className="p-4">
          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : (
            <p className="text-sm text-gray-500 text-center">
              本のISBNバーコードをカメラに向けてください
            </p>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  )
}
