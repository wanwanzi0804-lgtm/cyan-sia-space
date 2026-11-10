# 推送前跑：更新版本戳，主屏幕版会自动换成新版（python3 tools/bump.py）
import re, time, pathlib
p = pathlib.Path(__file__).resolve().parent.parent / 'index.html'
s = p.read_text(encoding='utf-8')
s2 = re.sub(r"const BUILD = '[0-9]+'", "const BUILD = '%s'" % time.strftime('%Y%m%d%H%M%S'), s, count=1)
p.write_text(s2, encoding='utf-8')
print('bumped')
