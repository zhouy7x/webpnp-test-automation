# vim: set ts=4 sw=4 tw=99 et:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import os
import sys
import time
import utils
# from utils import winRun
import subprocess
from utils import Run
from utils import now


# add Chromium Engine
class Chromium(object):
    def __init__(self, source="chromium2\\src", repoPath="C:\\src"):
        self.source = "chromium2\\src"
        self.repoPath = "C:\\src"
        self.args = []
        self.cpu = "x64"
        self.dirname = sys.path[0]
        self.sourcePath = os.path.join(self.repoPath, self.source)

    def updateAndBuild(self, rev=None):
        result = {
            'status': 0,
            'msg': None
        }
        try:
            # update chromium repo
            if rev:
                self._update(rev)
            # build
            out_path = self.build()
        except Exception as e:
            result['status'] = 1
            result['msg'] = e
            return result

        # zip file
        zip_file_output_path = self._zip(out_path, rev)
        result['msg'] = zip_file_output_path
        return result

    def _update(self, rev):
        # sourcePath = os.path.join(self.repoPath, self.source)
        with utils.FolderChanger(self.sourcePath):
            env = os.environ.copy()
            # reset to master branch
            Run(['git', 'reset', '--hard'], env)
            Run(['git', 'checkout', 'master'], env)
            Run(['git', 'fetch'], env)
            Run(['git', 'reset' ,'--hard', rev])
            Run(['gclient', 'sync', '-D', '-j8', '-f'], env)

    def _zip(self, out_path, rev=None):
        name = now()
        if rev:
            name += '_rev_'
            name += rev
        name += '.zip'
        print(name)
        dest = os.path.join(self.sourcePath, 'out_zip', name)
        utils.Zip(src=out_path, dest=dest, exclude=self.libpaths()[0]['exclude'])

    def build(self):
        env = os.environ.copy()
        # env["NO_AUTH_BOTO_CONFIG"] = "/repos/boto.cfg"
        # sourcePath = os.path.join(self.repoPath, self.source)

        # add build command code here
        with utils.FolderChanger(self.sourcePath):
            try:
                in_argns_name = self.cpu + ".gn"
                in_argns = os.path.join(self.dirname, 'gn_file', in_argns_name)
                out_argns = os.path.join(self.repoPath, self.source, 'out', self.cpu, 'args.gn')
                if not os.path.isdir(os.path.join(self.repoPath, self.source, 'out', self.cpu)):
                    os.mkdir(os.path.join(self.repoPath, self.source, 'out', self.cpu))
                Run(['copy', in_argns, out_argns], env)
                Run(['gn', 'gen', os.path.join(self.sourcePath, 'out', self.cpu)], env)
                Run(['ninja', '-C', os.path.join(self.sourcePath, 'out', self.cpu), 'chrome', '-j40'], env)
            except subprocess.CalledProcessError as e:
                print("Dirty build failed!")
                try:
                    in_argns_name = self.cpu + ".gn"
                    in_argns = os.path.join(self.dirname, 'gn_file', in_argns_name)
                    out_argns = os.path.join(self.repoPath, self.source, 'out', self.cpu, 'args.gn')
                    Run(['rmdir', '/s', '/q', os.path.join(self.repoPath, self.source, 'out', self.cpu)])
                    Run(['mkdir', os.path.join(self.repoPath, self.source, 'out', self.cpu)])
                    Run(['copy', in_argns, out_argns], env)
                    Run(['gn', 'gen', os.path.join(self.sourcePath, 'out', self.cpu)], env)
                    Run(['ninja', '-C', os.path.join(self.sourcePath, 'out', self.cpu), 'chrome', '-j40'], env)
                except subprocess.CalledProcessError as e:
                    print("Clean build failed!")
                    raise e

        return os.path.join(self.sourcePath, 'out', self.cpu)

    def shell(self):
        return os.path.join(self.repoPath, self.source, 'out', self.cpu, 'chrome')

    def libpaths(self):
        p = os.path.join(self.repoPath, self.source, 'out', self.cpu)
        return [{'path': p, 'exclude': ['obj', 'gen', 'clang_x64', 'clang_x86_v8_arm', 'pyproto', 'resources']}]

def build(engine, rev=None):
    print("build")
    # builder = Chromium(source="chromium2\\src", repoPath="C:\\src")

    result = engine.updateAndBuild(rev)
    if result['status']:
        print("error msg:\n"+result['msg'])
    else:
        print("zip file path: "+result['msg'])
    return result

if __name__ == "__main__":
    rev = sys.argv[1] if sys.argv[1:] else None
    print("build")
    builder = Chromium(source="chromium2\\src", repoPath="C:\\src")
    result = build(builder, rev)
    # print(zip_file_path)