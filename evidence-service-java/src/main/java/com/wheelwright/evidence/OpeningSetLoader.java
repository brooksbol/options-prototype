package com.wheelwright.evidence;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Opening Set Loader — reads the frozen experimental fixture from a seed file.
 *
 * The opening-relevant set is an experimental fixture with no product semantics.
 * It governs scheduling priority during the opening burst, orthogonal to A/B/C/D
 * service classes.
 *
 * File format: one symbol per line, # comments, blank lines ignored.
 */
public class OpeningSetLoader {

    private static final String DEFAULT_PATH = "./data/seeds/opening-set.txt";

    /**
     * Load the opening-relevant set from the configured file path.
     * Returns an empty set if the file does not exist or is empty (experiment disabled).
     */
    public static Set<String> load() {
        return load(getPath());
    }

    /**
     * Load from an explicit path.
     */
    public static Set<String> load(String path) {
        if (path == null || path.isBlank()) {
            return Collections.emptySet();
        }

        Path filePath = Path.of(path);
        if (!Files.exists(filePath)) {
            System.out.println("[opening-set] No fixture file found at " + path + " — experiment disabled.");
            return Collections.emptySet();
        }

        try {
            Set<String> symbols = new LinkedHashSet<>();
            for (String line : Files.readAllLines(filePath)) {
                String trimmed = line.trim();
                if (trimmed.isEmpty() || trimmed.startsWith("#")) continue;
                symbols.add(trimmed.toUpperCase());
            }

            if (symbols.isEmpty()) {
                System.out.println("[opening-set] Fixture file is empty — experiment disabled.");
            } else {
                System.out.printf("[opening-set] Loaded %d opening-relevant symbols.%n", symbols.size());
            }
            return Collections.unmodifiableSet(symbols);
        } catch (IOException e) {
            System.err.println("[opening-set] Failed to read fixture: " + e.getMessage());
            return Collections.emptySet();
        }
    }

    private static String getPath() {
        String envPath = System.getenv("OPENING_SET_PATH");
        if (envPath != null) return envPath;
        return DEFAULT_PATH;
    }
}
