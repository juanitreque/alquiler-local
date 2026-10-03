// Genera los iconos de la PWA en public/. Uso: swift scripts/make-icons.swift
import AppKit

func render(_ lado: CGFloat) -> Data {
    let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(lado), pixelsHigh: Int(lado), bitsPerSample: 8,
                               samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB,
                               bytesPerRow: 0, bitsPerPixel: 0)!
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    // Cuadrado completo: iOS redondea las esquinas él mismo.
    let rect = NSRect(x: 0, y: 0, width: lado, height: lado)
    NSGradient(colors: [NSColor(red: 0.12, green: 0.58, blue: 0.50, alpha: 1),
                        NSColor(red: 0.04, green: 0.36, blue: 0.31, alpha: 1)])!.draw(in: rect, angle: -90)
    let config = NSImage.SymbolConfiguration(pointSize: lado * 0.40, weight: .medium)
        .applying(.init(paletteColors: [.white]))
    if let s = NSImage(systemSymbolName: "storefront", accessibilityDescription: nil)?.withSymbolConfiguration(config) {
        let r = NSRect(x: (lado - s.size.width) / 2, y: (lado - s.size.height) / 2, width: s.size.width, height: s.size.height)
        s.draw(in: r)
    }
    NSGraphicsContext.restoreGraphicsState()
    return rep.representation(using: .png, properties: [:])!
}

for (nombre, lado) in [("apple-touch-icon", 180), ("icon-192", 192), ("icon-512", 512)] {
    try! render(CGFloat(lado)).write(to: URL(fileURLWithPath: "public/\(nombre).png"))
}
print("✓ iconos en public/")
