FROM outofcoffee/imposter:3.44.0 AS imposter

FROM eclipse-temurin:11.0.22_7-jre-jammy
COPY --from=imposter /opt/imposter/lib /opt/imposter/lib

COPY imposter/config /opt/imposter/config

HEALTHCHECK --interval=5s --timeout=5s --start-period=5s --retries=3 CMD curl -f http://localhost:8080/system/status || exit 1

ENTRYPOINT ["java", "-classpath", "/opt/imposter/lib/*", "io.gatehill.imposter.cmd.ImposterLauncher", "--configDir", "/opt/imposter/config"]
