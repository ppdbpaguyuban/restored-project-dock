import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { EditorWysiwyg } from "@/components/EditorWysiwyg";

describe("editor pengumuman", () => {
  it("hanya menyediakan alat yang dibutuhkan", () => {
    render(<EditorWysiwyg label="Isi" value="" onChange={() => {}} />);
    const nama = screen.getAllByRole("button").map((b) => b.getAttribute("aria-label"));
    expect(nama).toEqual(["Tebal", "Miring", "Daftar poin", "Daftar nomor", "Tautan", "Hapus format"]);
  });
});
