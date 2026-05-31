"use client";

import React, { useCallback, useState, useRef, useEffect } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Camera, RefreshCw, X } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface FileUploaderProps {
  onUploadSuccess?: (reportId: string) => void;
  className?: string;
}

export default function FileUploader({ onUploadSuccess, className }: FileUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  // Camera Integration States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera tracks when component unmounts or stream changes
  useEffect(() => {
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [videoStream]);

  // Bind video element to camera stream
  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
    }
  }, [videoStream, isCameraActive]);

  const startCamera = async (deviceId?: string) => {
    try {
      setErrorMessage("");
      setUploadState("idle");

      // Stop any existing stream
      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId } } 
          : { facingMode: "environment" }, // Default to rear camera on mobile
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setVideoStream(stream);
      setIsCameraActive(true);

      // Fetch all input devices (cameras)
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter((device) => device.kind === "videoinput");
      setDevices(videoDevices);
      
      if (!deviceId && videoDevices.length > 0) {
        // Find if an environmental/back camera is available, otherwise default to first
        const backCam = videoDevices.find(
          (d) => d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("environment")
        );
        setSelectedDeviceId(backCam ? backCam.deviceId : videoDevices[0].deviceId);
      } else if (deviceId) {
        setSelectedDeviceId(deviceId);
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setErrorMessage("Unable to access the camera. Please check camera permissions in your browser.");
      setUploadState("error");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      setVideoStream(null);
    }
    setIsCameraActive(false);
  };

  const switchCamera = (deviceId: string) => {
    startCamera(deviceId);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    
    // Use the actual video dimensions for high resolution capture
    canvas.width = video.videoWidth || 1920;
    canvas.height = video.videoHeight || 1080;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas image to Blob, then to File for backend upload
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const capturedFile = new File([blob], `captured_report_${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          stopCamera();
          processUpload(capturedFile);
        }
      },
      "image/jpeg",
      0.95 // High-quality JPEG
    );
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const processUpload = async (selectedFile: File) => {
    // Validate file size (15MB)
    const MAX_SIZE = 15 * 1024 * 1024;
    if (selectedFile.size > MAX_SIZE) {
      setErrorMessage("File exceeds the maximum size limit of 15MB.");
      setUploadState("error");
      return;
    }

    // Validate file type
    const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setErrorMessage("Unsupported file format. Please upload a PDF, PNG, or JPEG.");
      setUploadState("error");
      return;
    }

    setFile(selectedFile);
    setUploadState("uploading");
    setProgress(15);
    setErrorMessage("");

    try {
      // Simulate network upload progress smoothly
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 15;
        });
      }, 200);

      // Trigger Next.js report upload
      const response = await api.reports.uploadReport(selectedFile);
      const reportId = response.data?.report_id;
      
      clearInterval(interval);
      setProgress(90);
      setUploadState("processing");

      if (reportId) {
        // Trigger report processing and wait
        const token = localStorage.getItem('access_token');
        const processRes = await fetch('/api/ai/process-report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ reportId })
        });
        
        if (!processRes.ok) {
          const errData = await processRes.json();
          throw new Error(errData.detail || 'Analysis processing failed');
        }
      }

      setProgress(100);
      setUploadState("success");
      if (onUploadSuccess && reportId) {
        onUploadSuccess(reportId);
      }
      
    } catch (err: any) {
      setUploadState("error");
      setErrorMessage(
        err.message || "An error occurred while uploading your medical report. Please try again."
      );
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUpload(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const resetUploader = () => {
    setFile(null);
    setUploadState("idle");
    setProgress(0);
    setErrorMessage("");
  };

  return (
    <div className={cn("w-full max-w-2xl mx-auto font-sans select-none", className)}>
      {uploadState === "idle" && !isCameraActive && (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={triggerFileSelect}
          className={cn(
            "border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative glass group",
            isDragActive
              ? "border-brand-cyan bg-brand-cyan/5 scale-[1.01]"
              : "border-white/10 hover:border-brand-cyan/40 bg-transparent"
          )}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={onFileChange}
          />
          
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-brand-cyan to-brand-purple flex items-center justify-center shadow-lg shadow-brand-cyan/15 mb-4 group-hover:scale-105 transition-all duration-300">
            <Upload className="h-7 w-7 text-white" />
          </div>

          <h3 className="text-zinc-200 text-lg font-bold tracking-tight mb-1 font-outfit">
            Drag & drop your medical report
          </h3>
          <p className="text-zinc-400 text-sm mb-6 text-center max-w-sm font-light">
            Support PDF, PNG, or JPEG scans from primary diagnostic laboratories (Max 15MB)
          </p>

          <div className="flex flex-wrap justify-center gap-3 relative z-10">
            <button
              type="button"
              className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 text-xs font-bold hover:bg-white/10 transition-all cursor-pointer"
            >
              Browse Files
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering click on parent drop zone
                startCamera();
              }}
              className="px-5 py-2 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-xs font-bold hover:bg-brand-cyan/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Camera className="h-3.5 w-3.5" />
              Snap Report Photo
            </button>
          </div>
        </div>
      )}

      {/* Live Camera Interface */}
      {isCameraActive && (
        <div className="glass rounded-3xl p-6 border border-white/5 flex flex-col items-center relative overflow-hidden animate-fade-in">
          {/* Header Controls */}
          <div className="w-full flex items-center justify-between mb-4 z-10">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-brand-cyan animate-pulse" />
              <span className="text-zinc-200 text-xs font-bold font-outfit tracking-wider uppercase">Live Camera Ingestor</span>
            </div>
            
            <button 
              onClick={stopCamera}
              className="h-8 w-8 rounded-full bg-white/5 border border-white/5 text-zinc-400 hover:text-white flex items-center justify-center hover:bg-white/10 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Video Preview Frame */}
          <div className="w-full max-w-md aspect-[3/4] sm:aspect-[4/3] bg-black/40 rounded-2xl overflow-hidden relative border border-white/10 shadow-inner flex items-center justify-center mb-6">
            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              muted
              className="w-full h-full object-cover"
            />
            
            {/* OCR Scanner Laser Line Effect */}
            <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand-cyan to-transparent shadow-[0_0_12px_var(--color-brand-cyan)] opacity-70 animate-scan-laser pointer-events-none" />

            {/* Corner Bracket Guides for Ingestion framing */}
            <div className="absolute top-4 left-4 h-6 w-6 border-t-2 border-l-2 border-brand-cyan/40 rounded-tl-md pointer-events-none" />
            <div className="absolute top-4 right-4 h-6 w-6 border-t-2 border-r-2 border-brand-cyan/40 rounded-tr-md pointer-events-none" />
            <div className="absolute bottom-4 left-4 h-6 w-6 border-b-2 border-l-2 border-brand-cyan/40 rounded-bl-md pointer-events-none" />
            <div className="absolute bottom-4 right-4 h-6 w-6 border-b-2 border-r-2 border-brand-cyan/40 rounded-br-md pointer-events-none" />
            
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-bold text-white/50 bg-black/60 px-3 py-1 rounded-full uppercase tracking-widest backdrop-blur-sm pointer-events-none">
              Align document borders
            </span>
          </div>

          {/* Controls Footer */}
          <div className="w-full max-w-md flex flex-col gap-4 z-10">
            {/* Device Switcher Dropdown */}
            {devices.length > 1 && (
              <div className="flex items-center gap-2 justify-center">
                <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Select Device:</span>
                <select
                  value={selectedDeviceId}
                  onChange={(e) => switchCamera(e.target.value)}
                  className="bg-white/5 border border-white/10 text-zinc-300 text-[11px] rounded-lg px-2.5 py-1 outline-none hover:border-brand-cyan/30 transition-all font-semibold"
                >
                  {devices.map((device, idx) => (
                    <option key={device.deviceId} value={device.deviceId} className="bg-[#111C24] text-zinc-300">
                      {device.label || `Camera ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Capture Button Trigger */}
            <div className="flex justify-center items-center gap-4">
              <button
                onClick={stopCamera}
                className="px-5 py-3 rounded-2xl bg-white/5 border border-white/5 text-zinc-400 font-bold text-xs hover:text-white hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              
              <button
                onClick={capturePhoto}
                className="h-14 w-14 rounded-full bg-gradient-to-tr from-brand-cyan to-brand-purple hover:scale-105 active:scale-95 flex items-center justify-center shadow-lg shadow-brand-cyan/20 transition-all cursor-pointer group"
                title="Capture and Ingest Report"
              >
                <Camera className="h-6 w-6 text-white group-hover:rotate-6 transition-all" />
              </button>

              <button
                onClick={() => startCamera(selectedDeviceId)}
                className="h-10 w-10 rounded-full bg-white/5 border border-white/5 text-zinc-400 hover:text-white flex items-center justify-center hover:bg-white/10 transition-all"
                title="Restart Stream"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {(uploadState === "uploading" || uploadState === "processing") && file && (
        <div className="glass rounded-3xl p-8 border border-white/5 flex flex-col items-center justify-center text-center">
          <div className="relative h-16 w-16 mb-4 flex items-center justify-center bg-brand-cyan/10 rounded-2xl">
            {uploadState === "uploading" ? (
              <Loader2 className="h-8 w-8 text-brand-cyan animate-spin" />
            ) : (
              <div className="flex gap-0.5 items-center justify-center h-8 w-8">
                <span className="w-1.5 h-6 bg-brand-cyan rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                <span className="w-1.5 h-8 bg-brand-cyan rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                <span className="w-1.5 h-6 bg-brand-cyan rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
              </div>
            )}
          </div>

          <h3 className="text-zinc-200 text-lg font-bold tracking-tight font-outfit mb-1">
            {uploadState === "uploading" ? "Uploading clinical file" : "Ingesting data structure"}
          </h3>
          <p className="text-zinc-400 text-xs max-w-xs mb-6 truncate font-light">
            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>

          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden max-w-md mx-auto mb-2 relative">
            <div
              className="bg-gradient-to-r from-brand-cyan to-brand-purple h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            {uploadState === "uploading" ? `Progress: ${progress}%` : "Running OCR Binarization & LLM Correction..."}
          </span>
        </div>
      )}

      {uploadState === "success" && file && (
        <div className="glass rounded-3xl p-8 border border-brand-success/20 flex flex-col items-center justify-center text-center">
          <div className="h-16 w-16 rounded-2xl bg-brand-success/10 flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-brand-success" />
          </div>

          <h3 className="text-zinc-200 text-lg font-bold tracking-tight font-outfit mb-1">
            Analysis Scheduled Successfully!
          </h3>
          <p className="text-zinc-400 text-xs max-w-xs mb-6 font-light">
            The OCR engine is extracting parameter data. The AI will notify you as soon as analysis completes.
          </p>
          <button
            onClick={resetUploader}
            className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-xs font-bold hover:bg-white/10 transition-all cursor-pointer"
          >
            Upload another report
          </button>
        </div>
      )}

      {uploadState === "error" && (
        <div className="glass rounded-3xl p-8 border border-brand-danger/20 flex flex-col items-center justify-center text-center">
          <div className="h-16 w-16 rounded-2xl bg-brand-danger/10 flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-brand-danger" />
          </div>

          <h3 className="text-zinc-200 text-lg font-bold tracking-tight font-outfit mb-1">
            File Ingestion Error
          </h3>
          <p className="text-brand-danger/80 text-xs max-w-md mb-6 px-4 font-light leading-relaxed">
            {errorMessage}
          </p>
          <button
            onClick={resetUploader}
            className="px-5 py-2.5 rounded-xl bg-brand-danger/20 border border-brand-danger/30 text-white text-xs font-bold hover:bg-brand-danger/30 transition-all cursor-pointer"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
