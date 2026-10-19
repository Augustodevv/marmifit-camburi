"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

/** Botão flutuante de WhatsApp em todas as páginas da loja. */
export function WhatsAppFab({ phone }: { phone: string }) {
  const pathname = usePathname();
  // no configurador o resumo fixa no rodapé do celular: sobe o botão
  const lifted = pathname.startsWith("/monte-sua-marmita");
  return (
    <motion.a
      href={whatsappLink(phone, "Olá! Vim pelo site da Marmifit e quero fazer um pedido.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com a Marmifit no WhatsApp"
      initial={{ scale: 0, rotate: -45 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay: 1, type: "spring", stiffness: 260, damping: 16 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.92 }}
      className={cn(
        "group fixed right-4 z-40 flex items-center gap-2 rounded-full bg-[#25D366] p-4 text-white shadow-[0_12px_30px_-6px_rgba(37,211,102,0.6)] sm:right-6",
        lifted ? "bottom-24 lg:bottom-6" : "bottom-5 sm:bottom-6",
      )}
    >
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366] opacity-30" aria-hidden />
      <MessageCircle className="size-6" aria-hidden />
      <span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-sm font-bold transition-all duration-300 group-hover:max-w-40 sm:inline">
        Peça pelo WhatsApp
      </span>
    </motion.a>
  );
}
