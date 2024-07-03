import configparser
import sys

def bump_version(version):
    parts = version.split('.')
    if len(parts) == 3:
        major, minor, build = parts
        build = str(int(build) + 1)
        return f"{major}.{minor}.{build}"
    else:
        raise ValueError("Version format is incorrect, expected 'major.minor.build'")

def main():
    app_conf_path = 'default/app.conf'
    
    config = configparser.ConfigParser()
    config.read(app_conf_path)

    if 'launcher' not in config:
        config['launcher'] = {}
    if 'version' in config['launcher']:
        current_version = config['launcher']['version']
        new_version = bump_version(current_version)
        config['launcher']['version'] = new_version
        print(f"Bumping version: {current_version} -> {new_version}")
    else:
        config['launcher']['version'] = '1.0.0'
        print("Version information not found, setting initial version to 1.0.0")

    if 'ui' not in config:
        config['ui'] = {}
    config['ui']['is_visible'] = '1'
    config['ui']['label'] = 'TA-HSBC SecOps'

    if 'install' not in config:
        config['install'] = {}
    config['install']['is_configured'] = '1'

    if 'launch' not in config:
        config['launch'] = {}
    config['launch']['visible'] = 'true'

    with open(app_conf_path, 'w') as configfile:
        config.write(configfile)
    print(f"Updated version information written to {app_conf_path}")

if __name__ == "__main__":
    main()
