plugins {
    java
    id("org.springframework.boot") version "3.4.3"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "com.wheelwright"
version = "0.1.0-SNAPSHOT"

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}

repositories {
    mavenCentral()
}

dependencies {
    // Web
    implementation("org.springframework.boot:spring-boot-starter-web")

    // SQLite via JDBC
    implementation("org.xerial:sqlite-jdbc:3.49.1.0")

    // Test
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.withType<Test> {
    useJUnitPlatform()
    systemProperty("runRealFile", System.getProperty("runRealFile") ?: "")
    systemProperty("realFilePath", System.getProperty("realFilePath") ?: "")
}

// Multi-expiration surface analysis (experimental spike)
tasks.register<JavaExec>("importPositions") {
    mainClass.set("com.wheelwright.evidence.v2.ImportPositionSnapshot")
    classpath = sourceSets["main"].runtimeClasspath
    args = listOfNotNull(project.findProperty("positionDb") as? String,
        project.findProperty("positionAccount") as? String,
        project.findProperty("positionBrokerAccount") as? String,
        project.findProperty("positionCsv") as? String,
        project.findProperty("positionAssociations") as? String)
}

tasks.register<JavaExec>("analyzeSurface") {
    mainClass.set("com.wheelwright.evidence.MultiExpirationSurfaceAnalysis")
    classpath = sourceSets["main"].runtimeClasspath
    workingDir = rootProject.projectDir.parentFile  // Run from workspace root
    args = (project.findProperty("analysisArgs") as? String)?.split(" ") ?: listOf()
}

// BUG-030 is preserved as an intentionally failing negative-candidate reproduction.
// It enables the rejected global passthrough; current-design acceptance uses
// HeldQuoteCodecTransportTest with unchanged connector defaults instead.
tasks.test {
    exclude("**/HeldQuoteTransportPreservationTest.class")
}
// Reproduction pins the pre-instance controller; its original routing probe would
// otherwise overlap the now-implemented instance GET. This source set never ships.
val bug030 = sourceSets.create("bug030") {
    compileClasspath += sourceSets["main"].output + sourceSets["main"].compileClasspath
}
tasks.register<Test>("reproduceRejectedSolidusTransport") {
    description = "Reproduce BUG-030: intentionally fails the rejected passthrough preservation gate"
    group = "verification"
    testClassesDirs = sourceSets["test"].output.classesDirs
    classpath = bug030.output + sourceSets["test"].runtimeClasspath
    include("**/HeldQuoteTransportPreservationTest.class")
}

// Isolated Principal-facing visual preview: test-only backend, synthetic provider, disposable DB.
tasks.register<JavaExec>("step5Preview") {
    dependsOn(tasks.testClasses)
    mainClass.set("com.wheelwright.evidence.v2.Step5Preview")
    classpath = sourceSets["test"].runtimeClasspath
    args = listOfNotNull(project.findProperty("previewReady") as? String)
}
