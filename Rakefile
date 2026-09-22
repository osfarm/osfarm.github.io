# frozen_string_literal: true

require 'html-proofer'

task :test do
  sh 'bundle exec jekyll build'
  # Types et rattachements de l'annuaire : un « partie_de » cassé ne fait
  # échouer ni le build ni html-proofer, le lien mène simplement nulle part.
  # Voir _annuaire/DESIGN.md.
  sh 'python3 _annuaire/verifier.py'
  proofer = HTMLProofer.check_directory(
    './_site/',
    check_html: true,
    check_external_hash: false,
    hydra: { max_concurrency: 10 },
    # html-proofer 4 reads ignore_urls (url_ignore was its 3.x name and is ignored).
    # AgIoT's demo (_data/radar/communaute.yml) only serves plain HTTP; it shows on /fr/communs/.
    # LinkedIn répond 999 à tout ce qui n'est pas un navigateur : ce n'est pas
    # un lien mort, c'est son garde-barrière. Sans cette ligne, le pied de page
    # ferait échouer chaque `rake test`.
    ignore_urls: [%r{https://www\.linkedin\.com},
                  %r{https://developer.github.com}, %r{https://docs.github.com}, %r{https://help.github.com},
                  %r{\Ahttp://vcriis01\.inesctec\.pt},
                  # Documentation (_data/publications.yml) : ces trois sites
                  # renvoient 403 à tout robot (Akamai, Cloudflare). Les liens ont
                  # été lus à la main ou par Wayback le 22/09/2026 ; leur date de
                  # contrôle est dans `verifie_le`.
                  %r{\Ahttps://www\.oecd\.org/}, %r{\Ahttps://www\.usda\.gov/},
                  %r{\Ahttps://www\.undp\.org/}],
    ignore_files: [%r{/stories/}],
    ignore_status_codes: [429]
  )
  token = ENV.fetch('GITHUB_TOKEN', nil)
  unless token.nil?
    proofer.before_request do |request|
      request.options[:headers]['Authorization'] = "Bearer #{token}" if request.base_url == 'https://github.com'
    end
  end
  proofer.run
end
