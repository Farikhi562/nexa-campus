import Image from 'next/image'
// Import gambar secara langsung menggunakan alias
import LogoFull from '@/images/logo-full.png'

type NexaLogoProps = {
  className?: string
  imgClassName?: string
}

export default function NexaLogo({
  className = 'h-10 w-10 rounded-xl bg-white',
  imgClassName = 'h-full w-full object-contain',
}: NexaLogoProps) {
  return (
    <span className={`inline-flex flex-shrink-0 items-center justify-center overflow-hidden ${className}`}>
      {/* Masukkan variabel LogoFull ke dalam src */}
      <Image 
        src={LogoFull} 
        alt="NEXA" 
        className={imgClassName} 
        // width dan height opsional didefinisikan lagi jika sudah di-import langsung,
        // tapi tetap boleh dipasang untuk membatasi ukurannya
        width={64} 
        height={64} 
      />
    </span>
  )
}