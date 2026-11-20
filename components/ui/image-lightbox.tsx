"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ImageLightboxProps = {
  src: string;
  alt: string;
  className: string;
  fit?: "cover" | "contain";
  mediaType?: "image" | "pdf";
};

export function ImageLightbox({
  src,
  alt,
  className,
  fit = "cover",
  mediaType = "image",
}: ImageLightboxProps) {
  const [open, setOpen] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const [previewState, setPreviewState] = useState<"loading" | "ready" | "failed">("loading");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger = triggerRef.current;
    if (!dialog) return;

    if (open) {
      const previousOverflow = document.body.style.overflow;
      dialog.showModal();
      document.body.style.overflow = "hidden";
      return () => {
        if (dialog.open) dialog.close();
        document.body.style.overflow = previousOverflow;
        trigger?.focus();
      };
    }

    if (dialog.open) dialog.close();
  }, [open]);

  function showPreview() {
    setPreviewState("loading");
    setOpen(true);
  }

  return (
    <>
      <button
        ref={triggerRef}
        className={`image-lightbox-trigger ${className}`}
        type="button"
        aria-label={`Enlarge: ${alt}`}
        onClick={showPreview}
      >
        {mediaType === "pdf" ? (
          <iframe
            className="image-lightbox-pdf-thumb"
            src={`${src}#page=1&toolbar=0&navpanes=0`}
            title=""
            aria-hidden="true"
            tabIndex={-1}
            loading="lazy"
            onLoad={() => setThumbnailFailed(false)}
            onError={() => setThumbnailFailed(true)}
          />
        ) : thumbnailFailed ? (
          <span className="image-lightbox-placeholder" aria-hidden="true">
            Preview unavailable
          </span>
        ) : (
          <Image
            src={src}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 980px) 50vw, 33vw"
            className={`image-lightbox-thumb image-lightbox-thumb-${fit}`}
            onError={() => setThumbnailFailed(true)}
          />
        )}
        {mediaType === "pdf" && thumbnailFailed && (
          <span className="image-lightbox-placeholder" aria-hidden="true">
            PDF preview unavailable
          </span>
        )}
      </button>

      <dialog
        ref={dialogRef}
        className="image-lightbox-dialog"
        aria-label={`Image preview: ${alt}`}
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
      >
        <div className="image-lightbox-panel">
          <button
            className="image-lightbox-close"
            type="button"
            aria-label="Close preview"
            onClick={() => setOpen(false)}
          >
            <X size={20} aria-hidden="true" />
          </button>
          {previewState === "loading" && (
            <div className="image-lightbox-status" role="status">
              Loading preview…
            </div>
          )}
          {previewState === "failed" ? (
            <div className="image-lightbox-status" role="status">
              This preview could not be loaded. Please try again later.
            </div>
          ) : mediaType === "pdf" ? (
            <iframe
              className="image-lightbox-document"
              src={src}
              title={alt}
              onLoad={() => setPreviewState("ready")}
              onError={() => setPreviewState("failed")}
            />
          ) : (
            <Image
              src={src}
              alt={alt}
              fill
              unoptimized
              sizes="100vw"
              className="image-lightbox-preview"
              onLoad={() => setPreviewState("ready")}
              onError={() => setPreviewState("failed")}
            />
          )}
        </div>
      </dialog>
    </>
  );
}
