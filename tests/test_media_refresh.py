"""product-media.yml + tools/media-refresh.sh: the site's media re-record when the public screens change, and only the files the site shows are refreshed."""
import os
import pathlib
import re
import shutil
import subprocess
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
FLOW = (ROOT / '.github/workflows/product-media.yml').read_text()
CODE = re.sub(r'(?m)^\s*#.*$', '', FLOW)


def git(cwd, *args):
    return subprocess.run(['git', *args], cwd=cwd, check=True, capture_output=True, text=True).stdout


class MediaWorkflowTests(unittest.TestCase):
    def test_the_mac_job_runs_only_when_the_cheap_check_says_so(self):
        self.assertIn("if: needs.watch.outputs.record == 'yes'", CODE)
        self.assertIn('runs-on: ubuntu-24.04', CODE.split('media:')[0])
        self.assertIn('tools/media-paths.txt', CODE)
        self.assertIn("--ref '${{ needs.watch.outputs.sha }}'", CODE)   # the commit the check saw, not a newer main

    def test_webp_comes_from_ffmpeg_full_and_whole_encoder_names(self):
        self.assertIn('brew install ffmpeg-full', CODE)
        self.assertIn("grep -qE ' libwebp '", CODE)

    def test_the_record_hash_works_on_the_mac_runner(self):
        # run 39458753406: macos-14 has no sha256sum; the refresh step died with exit 127 after a good recording
        self.assertIn('shasum -a 256', (ROOT / 'tools/public-watch.sh').read_text())

    def test_no_ai_key_in_the_run(self):
        self.assertNotIn('ANTHROPIC', CODE)
        self.assertNotIn('direct.mjs', CODE)

    def test_every_watched_path_exists_in_the_public_tree_names(self):
        paths = (ROOT / 'tools/media-paths.txt').read_text().split()
        self.assertEqual(sorted(paths), sorted(set(paths)))
        self.assertIn('desktop/renderer', paths)
        self.assertIn('extension', paths)


class MediaRefreshTests(unittest.TestCase):
    def setUp(self):
        self.tmp = pathlib.Path(tempfile.mkdtemp())
        self.repo = self.tmp / 'repo'
        (self.repo / 'site/public/media').mkdir(parents=True)
        (self.repo / 'tools').mkdir()
        for name in ('media-refresh.sh', 'public-watch.sh', 'media-paths.txt'):
            shutil.copy(ROOT / 'tools' / name, self.repo / 'tools' / name)
        (self.repo / 'site/public/media/hero.mp4').write_text('old hero')
        (self.repo / 'site/public/media/still-jobs.webp').write_text('old still')
        git(self.repo, 'init', '-q', '-b', 'main')
        git(self.repo, '-c', 'user.name=t', '-c', 'user.email=t@example.com', 'add', '.')
        git(self.repo, '-c', 'user.name=t', '-c', 'user.email=t@example.com', 'commit', '-qm', 'start')
        self.tree = self.tmp / 'tree'
        (self.tree / 'desktop/renderer').mkdir(parents=True)
        (self.tree / 'desktop/renderer/app.js').write_text('screen')
        git(self.tree, 'init', '-q', '-b', 'main')
        git(self.tree, '-c', 'user.name=t', '-c', 'user.email=t@example.com', 'add', '.')
        git(self.tree, '-c', 'user.name=t', '-c', 'user.email=t@example.com', 'commit', '-qm', 'screens')
        self.set = self.tmp / 'set'
        self.set.mkdir()
        for name, text in (('manifest.json', '{}'), ('hero.mp4', 'new hero'), ('snip-new.webp', 'new piece')):
            (self.set / name).write_text(text)

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def refresh(self, folder=None):
        return subprocess.run(['bash', 'tools/media-refresh.sh', str(folder or self.set), str(self.tree), 'abc1234def', '--no-push'],
                              cwd=self.repo, capture_output=True, text=True)

    def test_only_the_files_the_site_shows_are_refreshed_and_the_screens_are_recorded(self):
        run = self.refresh()
        self.assertEqual(run.returncode, 0, run.stdout + run.stderr)
        media = self.repo / 'site/public/media'
        self.assertEqual((media / 'hero.mp4').read_text(), 'new hero')
        self.assertEqual((media / 'still-jobs.webp').read_text(), 'old still', 'a file the set did not make stays')
        self.assertFalse((media / 'snip-new.webp').exists(), 'a new piece is listed, never added')
        self.assertIn('snip-new.webp', run.stdout)
        self.assertIn('still-jobs.webp', run.stdout)
        self.assertEqual(git(self.repo, 'branch', '--show-current').strip(), 'media-refresh')
        self.assertIn('.public-media', git(self.repo, 'show', '--name-only', '--format=', 'HEAD'))

    def test_a_folder_without_a_manifest_is_refused(self):
        (self.set / 'manifest.json').unlink()
        run = self.refresh()
        self.assertNotEqual(run.returncode, 0)
        self.assertEqual((self.repo / 'site/public/media/hero.mp4').read_text(), 'old hero')


if __name__ == '__main__':
    unittest.main()
