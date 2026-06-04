import pathlib
import sys
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from notion_page_ref import NotionPageRefError, extract_notion_page_id  # noqa: E402


class ExtractNotionPageIdTests(unittest.TestCase):
    def test_accepts_compact_id(self):
        self.assertEqual(
            extract_notion_page_id("7e42f5b14f3b8379886101681dc4dd62"),
            "7e42f5b14f3b8379886101681dc4dd62",
        )

    def test_accepts_dashed_id(self):
        self.assertEqual(
            extract_notion_page_id("7e42f5b1-4f3b-8379-8861-01681dc4dd62"),
            "7e42f5b14f3b8379886101681dc4dd62",
        )

    def test_extracts_copy_link_slug_id(self):
        self.assertEqual(
            extract_notion_page_id(
                "https://www.notion.so/devninja/itriX-"
                "7e42f5b14f3b8379886101681dc4dd62?source=copy_link"
            ),
            "7e42f5b14f3b8379886101681dc4dd62",
        )

    def test_extracts_page_with_database_view_id(self):
        self.assertEqual(
            extract_notion_page_id(
                "https://www.notion.so/devninja/iTrix-"
                "ff8dac260246455797d53983594d6d0a"
                "?v=36f2f5b14f3b801491da000c8ee2e990&source=copy_link"
            ),
            "ff8dac260246455797d53983594d6d0a",
        )

    def test_prefers_page_query_param_for_database_urls(self):
        self.assertEqual(
            extract_notion_page_id(
                "https://www.notion.so/devninja/"
                "11111111111111111111111111111111"
                "?v=22222222222222222222222222222222"
                "&p=33333333333333333333333333333333"
            ),
            "33333333333333333333333333333333",
        )

    def test_rejects_view_only_urls(self):
        with self.assertRaises(NotionPageRefError):
            extract_notion_page_id(
                "https://www.notion.so/devninja/"
                "?v=22222222222222222222222222222222"
            )

    def test_rejects_empty_reference(self):
        with self.assertRaises(NotionPageRefError):
            extract_notion_page_id(" ")


if __name__ == "__main__":
    unittest.main()
