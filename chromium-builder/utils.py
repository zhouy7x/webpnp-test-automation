#!/usr/bin/python3
import os
import sys
import subprocess
import datetime
from zipfile import ZipFile


now = lambda: datetime.datetime.now().strftime("%Y%m%d-%H%M%S")


class FolderChanger:
    def __init__(self, folder):
        self.old = os.getcwd()
        self.new = folder

    def __enter__(self):
        os.chdir(self.new)

    def __exit__(self, type, value, traceback):
        os.chdir(self.old)


def chdir(folder):
    return FolderChanger(folder)


def move(src, dest):
    Run(['move', src, dest])


def Zip(src, dest=None, exclude=[]):
    with FolderChanger(src):
        with ZipFile(dest, 'w') as myzip:
            files = os.listdir(src)
            files.sort()
            for file_name in files:
                if file_name not in exclude:
                    myzip.write(file_name)




def winRun(vec):
    print(">> Executing in " + os.getcwd())
    cmd = 'cmd /c '+' '.join(vec)
    print(cmd)
    return os.system(cmd)

def Run(vec, env=os.environ.copy()):
    print(">> Executing in " + os.getcwd())
    vec = ' '.join(vec)
    print(vec)
    try:
        o = subprocess.check_output(vec, stderr=subprocess.STDOUT, env=env, shell=True)
    except subprocess.CalledProcessError as e:
        print('output was: ' + e.output)
        print(e)
        raise e
    o = o.decode("utf-8")
    try:
        print(o)
    except:
        print("print exception...")
    return o


