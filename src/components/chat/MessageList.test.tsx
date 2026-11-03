import { render, screen, within } from "@testing-library/react";
import { MessageList } from "./MessageList";
import { makeMessage } from "./testUtils";

describe("MessageList", () => {
  const scrollIntoView = vi.fn();

  beforeEach(() => {
    scrollIntoView.mockClear();
    Element.prototype.scrollIntoView = scrollIntoView;
  });

  afterEach(() => {
    // jsdom no implementa scrollIntoView: lo quitamos para no filtrar el mock.
    delete (Element.prototype as Partial<Element>).scrollIntoView;
  });

  it("renderiza los mensajes en orden dentro de un log accesible", () => {
    const messages = [makeMessage({ text: "hola" }), makeMessage({ author: "assistant", text: "¿qué querés?" })];
    render(<MessageList messages={messages} />);
    const log = screen.getByRole("log", { name: "Mensajes" });
    const items = within(log).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("hola");
    expect(items[1]).toHaveTextContent("¿qué querés?");
  });

  it("hace scroll al último mensaje al montar y cuando llega uno nuevo", () => {
    const first = makeMessage();
    const { rerender } = render(<MessageList messages={[first]} />);
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.contexts[0]).toBe(screen.getByTestId("messages-end"));

    rerender(<MessageList messages={[first, makeMessage()]} />);
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
  });

  it("muestra el indicador de escritura al final cuando isTyping es true", () => {
    const { rerender } = render(<MessageList messages={[makeMessage()]} />);
    expect(screen.queryByTestId("typing-indicator")).not.toBeInTheDocument();
    rerender(<MessageList messages={[makeMessage()]} isTyping />);
    expect(screen.getByTestId("typing-indicator")).toBeInTheDocument();
  });
});
