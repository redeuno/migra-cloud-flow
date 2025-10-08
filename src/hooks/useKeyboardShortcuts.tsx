import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignorar se estiver em um campo de input/textarea
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }

      const key = event.key.toLowerCase();
      const ctrl = event.ctrlKey || event.metaKey;

      // Atalhos globais
      if (ctrl) {
        switch (key) {
          case "n":
            event.preventDefault();
            shortcuts.new?.();
            break;
          case "k":
            event.preventDefault();
            shortcuts.search?.();
            break;
          case "h":
            event.preventDefault();
            navigate("/");
            break;
          case "a":
            event.preventDefault();
            navigate("/arenas");
            break;
          case "f":
            event.preventDefault();
            navigate("/financeiro");
            break;
        }
      }

      // Atalho sem modificador
      if (!ctrl && key === "?") {
        event.preventDefault();
        shortcuts.help?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, navigate]);
}
