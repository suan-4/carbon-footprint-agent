from pathlib import Path
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT / ".python_packages") not in sys.path:
    sys.path.insert(0, str(ROOT / ".python_packages"))

from PIL import Image

import tools.generate_exp04_word as word_gen


class Exp04WordRenderTest(unittest.TestCase):
    def test_system_architecture_png_has_no_large_black_block(self):
        original_png_dir = word_gen.PNG_DIR
        try:
            with tempfile.TemporaryDirectory() as tmp:
                word_gen.PNG_DIR = Path(tmp)
                png_path = word_gen.ensure_png("assets/architecture/system-architecture.svg", scale=1.0)
                self.assertTrue(png_path.exists())

                image = Image.open(png_path).convert("RGB")
                total_pixels = image.width * image.height
                black_pixels = 0

                for r, g, b in image.getdata():
                    if r < 12 and g < 12 and b < 12:
                        black_pixels += 1

                black_ratio = black_pixels / total_pixels
                self.assertLess(
                    black_ratio,
                    0.05,
                    f"unexpected black pixel ratio: {black_ratio:.3f}",
                )
        finally:
            word_gen.PNG_DIR = original_png_dir


if __name__ == "__main__":
    unittest.main()
